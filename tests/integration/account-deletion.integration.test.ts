import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import test from 'node:test'
import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@/lib/generated/prisma/client'

// NEVER use DATABASE_URL or a default .env value for a deletion test.
// The operator must supply a separate disposable DB and an explicit opt-in.
const url = process.env.CELESTIA_TEST_DATABASE_URL
const acknowledged = process.env.CELESTIA_TEST_DB_ACK === 'DISPOSABLE_STAGING_ONLY'
const conflicts = Boolean(url && [process.env.DATABASE_URL, process.env.DIRECT_URL].includes(url))
const enabled = Boolean(url && acknowledged && !conflicts && /^postgres(?:ql)?:\/\//.test(url))
const skipReason = enabled ? false : 'Requires an explicit disposable CELESTIA_TEST_DATABASE_URL and CELESTIA_TEST_DB_ACK; never run against application DATABASE_URL'

test('real PostgreSQL account-deletion claim is atomic and cleanup rolls back', {skip: skipReason}, async () => {
  const db = new PrismaClient({adapter: new PrismaPg({connectionString: url!, ssl: {rejectUnauthorized: false}, max: 2})})
  const userID = randomUUID()
  const userName = `stg${randomUUID().replaceAll('-', '').slice(0, 17)}`
  try {
    await db.users.create({data: {id: userID, userName, email: 'audit@example.invalid'}})
    await db.accountDeletion.create({
      data: {
        userID,
        status: 'pending_auth',
        storagePaths: {'profile-avatars': [], 'profile-covers': [], 'post-images': []}
      }
    })
    const claim = (leaseToken: string) => db.accountDeletion.updateMany({
      where: {userID, OR: [{leaseExpiresAt: null}, {leaseExpiresAt: {lt: new Date()}}]},
      data: {leaseToken, leaseExpiresAt: new Date(Date.now() + 60000)}
    })
    const [first, second] = await Promise.all([claim('first'), claim('second')])
    assert.equal(first.count + second.count, 1)
    const owner = first.count ? 'first' : 'second'
    const loser = first.count ? 'second' : 'first'
    assert.equal((await db.accountDeletion.findUniqueOrThrow({where: {userID}})).leaseToken, owner)
    assert.equal((await claim(loser)).count, 0)

    await assert.rejects(db.$transaction(async tx => {
      await tx.users.delete({where: {id: userID}})
      await tx.accountDeletion.update({where: {userID}, data: {status: 'pending_storage'}})
      throw new Error('injected rollback')
    }), /injected rollback/)
    assert.ok(await db.users.findUnique({where: {id: userID}}))
    assert.equal((await db.accountDeletion.findUniqueOrThrow({where: {userID}})).status, 'pending_auth')

    await db.accountDeletion.update({where: {userID}, data: {leaseExpiresAt: new Date(Date.now() - 1000)}})
    assert.equal((await claim('new-owner')).count, 1)
    assert.equal((await db.accountDeletion.findUniqueOrThrow({where: {userID}})).leaseToken, 'new-owner')
  } finally {
    // Delete only our generated fixture; unrelated staging rows are never targeted.
    try { await db.accountDeletion.deleteMany({where: {userID}}) } finally {
      await db.users.deleteMany({where: {id: userID}})
      await db.$disconnect()
    }
  }
})
