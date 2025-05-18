import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Apple, Utensils, ShoppingCart, Calendar } from "lucide-react";

// Placeholder component for Nutrition page
export default function Nutrition() {
  return (
    <div className="p-6">
      <Heading 
        title="Nutrition Center"
        description="Anti-inflammatory diet plans, recipes, and tracking"
      />
      
      <Tabs defaultValue="recipes">
        <TabsList className="mb-6">
          <TabsTrigger value="recipes">
            <Utensils className="h-4 w-4 mr-2" /> Recipes
          </TabsTrigger>
          <TabsTrigger value="meal-plan">
            <Calendar className="h-4 w-4 mr-2" /> Meal Plan
          </TabsTrigger>
          <TabsTrigger value="shopping">
            <ShoppingCart className="h-4 w-4 mr-2" /> Shopping List
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recipes">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Anti-Inflammatory Recipes</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Filter</Button>
              <Button size="sm">
                <Apple className="h-4 w-4 mr-2" />
                Log Meal
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-${1546069901 + index}-ba9599a7e63c?auto=format&fit=crop&w=600&h=300`} 
                  alt="Healthy meal" 
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">
                    {["Turmeric Roasted Vegetables", "Ginger Salmon Bowl", "Berries & Yogurt Parfait", "Mediterranean Salad", "Avocado Toast", "Green Smoothie"][index % 6]}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Anti-inflammatory ingredients to boost your immune system
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      High Antioxidants
                    </span>
                    <Button variant="ghost" size="sm">View Recipe</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="meal-plan">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Meal Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Your personalized meal plan will appear here
              </p>
              <Button className="mx-auto block">Generate Meal Plan</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shopping">
          <Card>
            <CardHeader>
              <CardTitle>Shopping List</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Your shopping list will be generated based on your meal plan
              </p>
              <Button className="mx-auto block">Generate Shopping List</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
