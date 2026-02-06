import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Apple, Utensils, ShoppingCart, Calendar } from "lucide-react";

export default function Nutrition() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Nutrition Center"
        description="Anti-inflammatory diet plans, recipes, and tracking"
      />
      
      <Tabs defaultValue="recipes">
        <TabsList className="mb-6 bg-[hsl(30,8%,13%)] border border-[hsl(30,8%,20%)]">
          <TabsTrigger value="recipes" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <Utensils className="h-4 w-4 mr-2" /> Recipes
          </TabsTrigger>
          <TabsTrigger value="meal-plan" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <Calendar className="h-4 w-4 mr-2" /> Meal Plan
          </TabsTrigger>
          <TabsTrigger value="shopping" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <ShoppingCart className="h-4 w-4 mr-2" /> Shopping List
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recipes">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-heading text-[hsl(40,20%,88%)]">Anti-Inflammatory Recipes</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-[hsl(30,8%,25%)] text-[hsl(35,15%,65%)] hover:bg-primary/10 hover:text-gold font-body">Filter</Button>
              <Button size="sm" className="bg-gold text-[hsl(30,15%,7%)] hover:bg-gold/90 font-body">
                <Apple className="h-4 w-4 mr-2" />
                Log Meal
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {["Turmeric Roasted Vegetables", "Ginger Salmon Bowl", "Berries & Yogurt Parfait", "Mediterranean Salad", "Avocado Toast", "Green Smoothie"].map((title, index) => (
              <Card key={index} className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)] overflow-hidden hover:border-gold/20 transition-all duration-300">
                <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-[hsl(30,8%,15%)] flex items-center justify-center">
                  <Apple className="h-12 w-12 text-gold/30" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading text-sm text-[hsl(40,20%,88%)] mb-1">{title}</h3>
                  <p className="text-sm text-[hsl(35,10%,50%)] font-body mb-3">
                    Anti-inflammatory ingredients to boost your immune system
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-body font-medium px-2 py-1 bg-primary/20 text-gold/80 rounded border border-primary/30">
                      High Antioxidants
                    </span>
                    <Button variant="ghost" size="sm" className="text-gold/70 hover:text-gold font-body">View Recipe</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="meal-plan">
          <Card className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Weekly Meal Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(35,10%,45%)] text-center py-12 font-body">
                Your personalized meal plan will appear here
              </p>
              <Button className="mx-auto block bg-gold text-[hsl(30,15%,7%)] hover:bg-gold/90 font-heading">Generate Meal Plan</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shopping">
          <Card className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Shopping List</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(35,10%,45%)] text-center py-12 font-body">
                Your shopping list will be generated based on your meal plan
              </p>
              <Button className="mx-auto block bg-gold text-[hsl(30,15%,7%)] hover:bg-gold/90 font-heading">Generate Shopping List</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}