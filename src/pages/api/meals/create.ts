import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/verifyToken';
import { firebaseAdminDb } from '@/lib/firebase-admin';
import { ref, push, set } from 'firebase-admin/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const uid = await verifyToken(req);    const { title, description, calories, date } = req.body;

    if (!title || !calories || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const mealsRef = ref(firebaseAdminDb, `users/${uid}/meals`);
    const newMealRef = push(mealsRef);
    
    await set(newMealRef, {
      title,
      description: description || null,
      calories: Number(calories),
      date: new Date(date).getTime(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    res.status(200).json({ success: true, mealId: newMealRef.key });
  } catch (error: any) {
    console.error('Error creating meal:', error);
    res.status(401).json({ message: error.message });
  }
}
