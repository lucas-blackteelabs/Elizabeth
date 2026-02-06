import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Apple, Utensils, ShoppingCart, Heart } from "lucide-react";

export default function Nutrition() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Nutrition Centre"
        description="Liver-supportive, anti-inflammatory foods to fuel your healing"
      />

      <Card className="bg-primary/10 border-primary/20 mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-[hsl(25,30%,28%)] font-body">
            <span className="font-medium">For your situation:</span> After immunotherapy-related hepatitis, focus on liver-supportive and anti-inflammatory foods. Your liver is recovering beautifully — nourish it with gentle, whole foods that also support your immune system's ongoing work against melanoma.
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="recipes">
        <TabsList className="mb-6 bg-[hsl(30,30%,95%)] border border-[hsl(30,25%,87%)]">
          <TabsTrigger value="recipes" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Utensils className="h-4 w-4 mr-2" /> Recipes
          </TabsTrigger>
          <TabsTrigger value="liver" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Heart className="h-4 w-4 mr-2" /> Liver Support
          </TabsTrigger>
          <TabsTrigger value="shopping" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <ShoppingCart className="h-4 w-4 mr-2" /> Shopping List
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recipes">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-heading text-[hsl(25,30%,28%)]">Anti-Inflammatory & Immune-Boosting Recipes</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {title: "Turmeric Golden Milk", desc: "Anti-inflammatory curcumin with black pepper for absorption", tag: "Immune Support"},
              {title: "Beetroot & Carrot Soup", desc: "Liver-cleansing vegetables with ginger and garlic", tag: "Liver Support"},
              {title: "Wild Salmon with Greens", desc: "Omega-3 rich salmon with dark leafy greens and lemon", tag: "Anti-Inflammatory"},
              {title: "Berry Antioxidant Smoothie", desc: "Blueberries, acai, spinach, and flaxseed", tag: "Antioxidant Rich"},
              {title: "Mediterranean Lentil Bowl", desc: "Fibre-rich lentils with olive oil, herbs, and vegetables", tag: "Gut Health"},
              {title: "Green Tea Matcha Bowl", desc: "Matcha with avocado, nuts, seeds, and fresh fruit", tag: "Immune Support"}
            ].map((recipe, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] overflow-hidden hover:border-primary/30 transition-all duration-300">
                <div className="w-full h-32 bg-gradient-to-br from-primary/15 to-[hsl(34,55%,52%)]/10 flex items-center justify-center">
                  <Apple className="h-10 w-10 text-primary/30" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading text-sm text-[hsl(25,30%,28%)] mb-1">{recipe.title}</h3>
                  <p className="text-sm text-[hsl(25,18%,50%)] font-body mb-3">{recipe.desc}</p>
                  <span className="text-xs font-body font-medium px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">
                    {recipe.tag}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="liver">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader>
                <CardTitle className="font-heading text-[hsl(34,55%,45%)]">Foods That Support Liver Recovery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 font-body text-sm text-[hsl(25,18%,48%)]">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Cruciferous vegetables</span> — broccoli, cauliflower, Brussels sprouts support liver detox enzymes</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Beetroot</span> — contains betaine which supports liver cell function</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Leafy greens</span> — spinach, kale, rocket rich in chlorophyll and antioxidants</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Garlic & onions</span> — contain sulphur compounds that aid liver detoxification</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Berries</span> — antioxidant-rich, especially blueberries protect liver cells</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Fatty fish</span> — salmon, sardines provide omega-3s that reduce liver inflammation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader>
                <CardTitle className="font-heading text-[hsl(34,55%,45%)]">Foods to Minimise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 font-body text-sm text-[hsl(25,18%,48%)]">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(0,50%,55%)] mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Alcohol</span> — places additional burden on recovering liver</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(0,50%,55%)] mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Processed foods</span> — preservatives and additives stress the liver</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(0,50%,55%)] mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Refined sugars</span> — contribute to inflammation and fatty liver</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(0,50%,55%)] mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Excess saturated fat</span> — can impede liver recovery</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(34,55%,52%)] mt-1.5 flex-shrink-0" />
                    <p><span className="font-medium text-[hsl(25,30%,28%)]">Grapefruit</span> — may interact with some medications; check with your team</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="shopping">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-[hsl(34,55%,45%)]">Healing Shopping List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-heading text-sm text-primary mb-3">Vegetables</h3>
                  <ul className="space-y-1 text-sm text-[hsl(25,18%,48%)] font-body">
                    <li>Broccoli & cauliflower</li>
                    <li>Beetroot</li>
                    <li>Spinach & kale</li>
                    <li>Sweet potato</li>
                    <li>Garlic & ginger</li>
                    <li>Red capsicum</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading text-sm text-primary mb-3">Proteins & Fats</h3>
                  <ul className="space-y-1 text-sm text-[hsl(25,18%,48%)] font-body">
                    <li>Wild salmon</li>
                    <li>Sardines</li>
                    <li>Walnuts & almonds</li>
                    <li>Extra virgin olive oil</li>
                    <li>Avocados</li>
                    <li>Chia & flax seeds</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading text-sm text-primary mb-3">Fruits & Extras</h3>
                  <ul className="space-y-1 text-sm text-[hsl(25,18%,48%)] font-body">
                    <li>Blueberries & raspberries</li>
                    <li>Lemons & limes</li>
                    <li>Green tea / matcha</li>
                    <li>Turmeric (fresh & powder)</li>
                    <li>Raw honey</li>
                    <li>Dark chocolate (85%+)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
