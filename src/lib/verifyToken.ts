import { NextApiRequest } from 'next';
import { firebaseAdminAuth } from './firebase-admin';

export async function verifyToken(req: NextApiRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('No token found');
  }

  try {
    const decodedToken = await firebaseAdminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
