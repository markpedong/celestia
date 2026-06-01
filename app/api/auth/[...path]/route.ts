import { auth } from "@/lib/auth";

export const { GET, POST, DELETE, PATCH, PUT } = auth.handler()