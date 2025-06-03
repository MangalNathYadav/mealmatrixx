'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { firebaseDb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface MealData {
  calories: number;
  date: number;
}

interface ChartData {
  date: string;
  calories: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeals: 0,
    totalCalories: 0,
    avgCalories: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (!user) return;

    const mealsRef = ref(firebaseDb, `users/${user.uid}/meals`);
    const unsubscribe = onValue(mealsRef, (snapshot) => {
      const meals = snapshot.val();
      if (!meals) {
        setStats({ totalMeals: 0, totalCalories: 0, avgCalories: 0 });
        setChartData([]);
        setLoading(false);
        return;
      }

      // Convert meals object to array and sort by date
      const mealsArray: MealData[] = Object.values(meals);
      mealsArray.sort((a, b) => a.date - b.date);

      // Calculate stats
      const totalMeals = mealsArray.length;
      const totalCalories = mealsArray.reduce((sum, meal) => sum + meal.calories, 0);
      const avgCalories = Math.round(totalCalories / totalMeals);

      setStats({ totalMeals, totalCalories, avgCalories });

      // Prepare chart data - last 7 days
      const last7Days = new Array(7).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chartData = last7Days.map(date => {
        const dayMeals = mealsArray.filter(meal => {
          const mealDate = new Date(meal.date).toISOString().split('T')[0];
          return mealDate === date;
        });
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          calories: dayMeals.reduce((sum, meal) => sum + meal.calories, 0),
        };
      });

      setChartData(chartData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Welcome, {user?.displayName || 'User'}!</h1>
        <Button asChild>
          <Link href="/dashboard/meals/new">Log a Meal</Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Total Meals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalMeals}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Total Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalCalories}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Average Calories/Meal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.avgCalories}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full aspect-[2/1] bg-background rounded-lg border p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Calories Over Time</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
