import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/verifyToken';
import { firebaseAdminAuth } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const uid = await verifyToken(req);
    await firebaseAdminAuth.deleteUser(uid);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(401).json({ message: error.message });
  }
}
