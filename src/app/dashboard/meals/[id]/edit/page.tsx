'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { firebaseDb } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  calories: z.number().min(1, 'Calories must be greater than 0'),
  date: z.string(),
});

export default function EditMealPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {      title: '',
      description: '',
      calories: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (!user) return;

    const fetchMeal = async () => {
      try {
        const mealRef = ref(firebaseDb, `users/${user.uid}/meals/${params.id}`);
        const snapshot = await get(mealRef);
        
        if (!snapshot.exists()) {
          toast({
            title: 'Error',
            description: 'Meal not found',
            variant: 'destructive',
          });
          router.push('/dashboard/meals');
          return;
        }

        const meal = snapshot.val();
        form.reset({
          title: meal.title,
          description: meal.description || '',
          calories: meal.calories,

          date: new Date(meal.date).toISOString().split('T')[0],
        });
        setIsLoading(false);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        router.push('/dashboard/meals');
      }
    };

    fetchMeal();
  }, [user, params.id, form, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    try {
      setIsLoading(true);
      const mealRef = ref(firebaseDb, `users/${user.uid}/meals/${params.id}`);
      
      await update(mealRef, {
        ...values,
        date: new Date(values.date).getTime(),
        updatedAt: Date.now(),
      });

      toast({
        title: 'Success',
        description: 'Meal updated successfully!',
      });

      router.push('/dashboard/meals');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Meal</CardTitle>
          <CardDescription>
            Update the details of your meal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Breakfast, Lunch, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Give your meal a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What did you eat? Add any notes here."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the total calories
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
