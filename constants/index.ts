import { __TRootResponse } from "@/lib/types";

export const DEFAULT_ERROR = {
  code: 500,
  data: null,
  msg: 'Internal Server Error',
} satisfies __TRootResponse<null>;