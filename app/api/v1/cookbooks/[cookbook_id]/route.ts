import { NextRequest } from 'next/server';
import config from '@/moonshot.config';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  let cookbook_id: string;
  try {
    cookbook_id = request.nextUrl.pathname.split('/')[4];
  } catch (error) {
    return new Response('Unable to get cookbook id from url path', {
      status: 500,
    });
  }
  const response = await fetch(
    `${config.webAPI.hostURL}${config.webAPI.basePathCookbooks}/${cookbook_id}`,
    {
      method: 'PUT',
    }
  );
  return response;
}

export async function GET(request: NextRequest) {
  let cookbook_id: string;
  try {
    cookbook_id = request.nextUrl.pathname.split('/')[4];
  } catch (error) {
    return new Response('Unable to get cookbook id from url path', {
      status: 500,
    });
  }
  const response = await fetch(
    `${config.webAPI.hostURL}${config.webAPI.basePathCookbooks}/${cookbook_id}?include_history=true`
  );
  return response;
}
