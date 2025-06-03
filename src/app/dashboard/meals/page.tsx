'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue, remove } from 'firebase/database';
import { firebaseDb } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface Meal {
  id: string;
  title: string;
  description: string | null;
  calories: number;
  date: number;
  createdAt: number;
  updatedAt: number;
}

export default function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!user) return;

    const mealsRef = ref(firebaseDb, `users/${user.uid}/meals`);
    const unsubscribe = onValue(mealsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMeals([]);
        setLoading(false);
        return;
      }

      const mealsArray: Meal[] = Object.entries(data).map(([id, meal]: [string, any]) => ({
        id,
        ...meal,
      }));

      // Sort by date, newest first
      mealsArray.sort((a, b) => b.date - a.date);
      setMeals(mealsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (meal: Meal) => {
    if (!user) return;

    try {
      await remove(ref(firebaseDb, `users/${user.uid}/meals/${meal.id}`));
      toast({
        title: 'Success',
        description: 'Meal deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Meals</h1>
        <Button asChild>
          <Link href="/dashboard/meals/new">Log a New Meal</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {meals.map((meal) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card>
                <CardHeader>
                  <CardTitle>{meal.title}</CardTitle>
                  <CardDescription>
                    {new Date(meal.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {meal.description && <p className="mb-4 text-muted-foreground">{meal.description}</p>}
                  <p className="text-lg font-semibold">{meal.calories} calories</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/meals/${meal.id}/edit`}>Edit</Link>
                  </Button>
                  <Dialog open={showDeleteDialog && mealToDelete?.id === meal.id} onOpenChange={(open) => {
                    setShowDeleteDialog(open);
                    if (!open) setMealToDelete(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          setMealToDelete(meal);
                          setShowDeleteDialog(true);
                        }}
                      >
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your meal entry.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            if (mealToDelete) {
                              handleDelete(mealToDelete);
                              setShowDeleteDialog(false);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {meals.length === 0 && (
          <div className="col-span-full text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No meals logged yet</h2>
            <p className="text-muted-foreground mb-4">Start tracking your meals to see them here</p>
            <Button asChild>
              <Link href="/dashboard/meals/new">Log Your First Meal</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
