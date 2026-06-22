// lib/api-response.ts
import { NextResponse } from 'next/server';

export const apiResponse = {
  success<T>(data: T, status = 200, message = "Data fetched successfully") {
    return NextResponse.json(
      {
        success: true,
        data,
        message
      },
      { status },
    );
  },

  error(message: string, status = 400) {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  },
};