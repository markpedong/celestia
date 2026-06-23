CREATE OR REPLACE FUNCTION "public".prevent_username_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Username cannot be changed after account creation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_username_immutable ON "user_profiles";

CREATE TRIGGER user_profiles_username_immutable
BEFORE UPDATE OF username ON "user_profiles"
FOR EACH ROW EXECUTE FUNCTION "public".prevent_username_change();
