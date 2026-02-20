/**
 * Mock shop products for Enhanced.AI bodybuilder-focused store.
 * Affiliate URLs are placeholders — replace with real tracking links (Amazon, CJ, Impact).
 */

export type ProductCategory =
  | 'supplements'
  | 'supplies'
  | 'tools'
  | 'coaching'
  | 'telehealth'
  | 'bloodwork'
  | 'training'
  | 'hair_health'
  | 'trt_clinics'
  | 'counseling'
  | 'apparel'
  | 'equipment'
  | 'recovery'
  | 'nutrition'
  | 'tech'
  | 'education'
  | 'health_services'

export interface ShopProduct {
  id: string
  title: string
  description: string
  price: string
  imageUrl: string
  affiliateUrl: string
  category: ProductCategory
  brand?: string
  comingSoon?: boolean
}

export const PRODUCT_CATEGORIES: Record<ProductCategory, string> = {
  supplements: 'Supplements',
  supplies: 'Supplies',
  tools: 'Tools',
  coaching: 'Coaching Affiliations',
  telehealth: 'Telehealth Consulting',
  bloodwork: 'Bloodwork Labs',
  training: 'Training Programs',
  hair_health: "Hair Loss & Men's Health",
  trt_clinics: 'TRT Clinics',
  counseling: 'Psychological Counseling',
  apparel: 'Apparel & Gear',
  equipment: 'Equipment',
  recovery: 'Recovery Tools',
  nutrition: 'Nutrition',
  tech: 'Tech & Tracking',
  education: 'Education & Resources',
  health_services: 'Health Services',
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  // Supplements
  { id: 's1', title: 'Whey Protein Isolate', description: '24g protein per scoop, low carb. Amazon affiliate.', price: '$34.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE', category: 'supplements', brand: 'Optimum Nutrition' },
  { id: 's2', title: 'Creatine Monohydrate', description: '5g per serving, supports strength and power.', price: '$19.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE2', category: 'supplements', brand: 'Optimum Nutrition' },
  { id: 's3', title: 'Vitamin D3 + K2', description: 'High absorption, supports bone and immune health.', price: '$24.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE3', category: 'supplements', brand: 'Thorne' },
  { id: 's4', title: 'Omega-3 Fish Oil', description: 'EPA/DHA for heart and joint support.', price: '$29.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE4', category: 'supplements', brand: 'Nordic Naturals' },
  { id: 's5', title: 'Pre-Workout', description: 'Caffeine, beta-alanine, citrulline for energy and pumps.', price: '$39.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE5', category: 'supplements', brand: 'Transparent Labs' },
  // Supplies
  { id: 'sp1', title: 'Gym Bag Pro', description: 'Large compartment, shoe pocket, water-resistant.', price: '$49.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE6', category: 'supplies' },
  { id: 'sp2', title: 'Shaker Bottle 32oz', description: 'BPA-free, measurement markings.', price: '$12.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE7', category: 'supplies' },
  { id: 'sp3', title: 'Lifting Straps', description: 'Heavy-duty nylon, secure grip for deadlifts.', price: '$18.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE8', category: 'supplies' },
  { id: 'sp4', title: 'Resistance Bands Set', description: '5 levels, door anchor, carry bag.', price: '$29.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE9', category: 'supplies' },
  { id: 'sp5', title: 'Knee Sleeves', description: '7mm neoprene, support for squats.', price: '$44.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE10', category: 'supplies' },
  // Tools
  { id: 't1', title: 'Body Measuring Tape', description: 'Retractable, accurate body measurements.', price: '$9.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE11', category: 'tools' },
  { id: 't2', title: 'Smart Scale', description: 'Body fat %, muscle mass, Bluetooth sync.', price: '$59.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE12', category: 'tools' },
  { id: 't3', title: 'Calipers Kit', description: 'Skinfold measurement for body fat estimation.', price: '$14.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE13', category: 'tools' },
  { id: 't4', title: 'Progress Photo Stand', description: 'Consistent angles for before/after shots.', price: '$34.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE14', category: 'tools' },
  { id: 't5', title: 'Food Scale Digital', description: 'Precision for macro tracking.', price: '$19.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE15', category: 'tools' },
  // Coaching (Coming Soon)
  { id: 'c1', title: '1-on-1 Coaching', description: 'Personalized programming from certified coaches.', price: 'TBD', imageUrl: '/api/placeholder/200/200', affiliateUrl: '#', category: 'coaching', comingSoon: true },
  { id: 'c2', title: 'Contest Prep Coach', description: 'Specialized prep for bodybuilding shows.', price: 'TBD', imageUrl: '/api/placeholder/200/200', affiliateUrl: '#', category: 'coaching', comingSoon: true },
  { id: 'c3', title: 'Nutrition Coaching', description: 'Custom meal plans and macro guidance.', price: 'TBD', imageUrl: '/api/placeholder/200/200', affiliateUrl: '#', category: 'coaching', comingSoon: true },
  // Telehealth
  { id: 'th1', title: 'Virtual Hormone Consult', description: 'Board-certified telehealth for hormone optimization.', price: 'From $99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/telehealth', category: 'telehealth' },
  { id: 'th2', title: 'Sports Medicine Telehealth', description: 'Remote consultations for athletes.', price: 'From $149', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/sports', category: 'telehealth' },
  { id: 'th3', title: 'Endocrinology Virtual Visit', description: 'Specialist review of bloodwork.', price: 'From $199', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/endo', category: 'telehealth' },
  // Bloodwork
  { id: 'b1', title: 'Comprehensive Male Panel', description: 'Testosterone, lipids, liver, CBC, more.', price: '$149', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/labs', category: 'bloodwork' },
  { id: 'b2', title: 'Hormone Panel Basic', description: 'Total T, free T, estrogen, SHBG.', price: '$89', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/labs2', category: 'bloodwork' },
  { id: 'b3', title: 'Lipid + Metabolic Panel', description: 'Cholesterol, glucose, liver enzymes.', price: '$69', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/labs3', category: 'bloodwork' },
  { id: 'b4', title: 'Full Wellness Panel', description: '50+ markers, thyroid, vitamins.', price: '$249', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/labs4', category: 'bloodwork' },
  { id: 'b5', title: 'Post-Cycle Panel', description: 'Recovery markers, HPTA assessment.', price: '$129', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/labs5', category: 'bloodwork' },
  // Training Programs
  { id: 'tr1', title: 'Hypertrophy Blueprint', description: '12-week muscle-building program.', price: '$47', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/program1', category: 'training' },
  { id: 'tr2', title: 'Powerlifting Fundamentals', description: 'SBD programming for beginners.', price: '$29', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/program2', category: 'training' },
  { id: 'tr3', title: 'Cutting Protocol', description: 'Preserve muscle while losing fat.', price: '$39', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/program3', category: 'training' },
  { id: 'tr4', title: 'PPL Split Advanced', description: '6-day push/pull/legs.', price: '$34', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/program4', category: 'training' },
  { id: 'tr5', title: 'Mobility & Recovery', description: 'Daily routines for longevity.', price: '$19', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/program5', category: 'training' },
  // Hair & Men's Health
  { id: 'h1', title: 'Minoxidil 5%', description: 'FDA-approved for hair regrowth.', price: '$24.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE16', category: 'hair_health' },
  { id: 'h2', title: 'Biotin 10,000mcg', description: 'Supports hair, skin, nails.', price: '$14.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE17', category: 'hair_health' },
  { id: 'h3', title: 'DHT Blocker Complex', description: 'Saw palmetto, pumpkin seed, etc.', price: '$29.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE18', category: 'hair_health' },
  { id: 'h4', title: 'Finasteride (Rx)', description: 'Prescription hair loss treatment.', price: 'From $20/mo', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/fin', category: 'hair_health' },
  { id: 'h5', title: 'Hair Growth Serum', description: 'Topical growth factors.', price: '$49.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE19', category: 'hair_health' },
  // TRT Clinics
  { id: 'trt1', title: 'TRT Clinic A', description: 'Nationwide telehealth TRT.', price: 'From $99/mo', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/trt1', category: 'trt_clinics' },
  { id: 'trt2', title: 'TRT Clinic B', description: 'Comprehensive hormone optimization.', price: 'From $149/mo', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/trt2', category: 'trt_clinics' },
  { id: 'trt3', title: 'TRT Clinic C', description: 'Sports medicine approach.', price: 'From $199/mo', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/trt3', category: 'trt_clinics' },
  // Counseling
  { id: 'ps1', title: 'BetterHelp', description: 'Online therapy, licensed counselors.', price: 'From $60/wk', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://betterhelp.com', category: 'counseling' },
  { id: 'ps2', title: 'Talkspace', description: 'Text, video, audio therapy.', price: 'From $69/wk', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://talkspace.com', category: 'counseling' },
  { id: 'ps3', title: 'Body Image Specialist', description: 'Therapy for body dysmorphia.', price: 'From $120/session', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/body', category: 'counseling' },
  // Apparel & Gear
  { id: 'a1', title: 'Lifting Belt', description: '4" leather, powerlifting approved.', price: '$89.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://roguefitness.com', category: 'apparel', brand: 'Rogue Fitness' },
  { id: 'a2', title: 'Compression Shorts', description: 'Moisture-wicking, support.', price: '$34.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://myprotein.com', category: 'apparel', brand: 'MyProtein' },
  { id: 'a3', title: 'Training Shoes', description: 'Flat sole for squats and deadlifts.', price: '$99.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/shoes', category: 'apparel' },
  { id: 'a4', title: 'Wrist Wraps', description: 'Heavy-duty support for pressing.', price: '$24.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://onnit.com', category: 'apparel', brand: 'Onnit' },
  { id: 'a5', title: 'Tank Top Pro', description: 'Breathable, durable fabric.', price: '$29.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://myprotein.com', category: 'apparel', brand: 'MyProtein' },
  // Equipment
  { id: 'e1', title: 'Adjustable Dumbbells', description: '5-52.5 lbs, space-saving.', price: '$349', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://repfitness.com', category: 'equipment', brand: 'REP Fitness' },
  { id: 'e2', title: 'Squat Rack', description: 'Half rack, safety arms.', price: '$499', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://repfitness.com', category: 'equipment', brand: 'REP Fitness' },
  { id: 'e3', title: 'Smart Bike', description: 'AI-powered HIIT, 20-min workouts.', price: '$2,495', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://carolfit.com', category: 'equipment', brand: 'CAROL Bike' },
  { id: 'e4', title: 'Treadmill Horizon', description: 'Folding, Bluetooth, 12% incline.', price: '$799', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://horizonfitness.com', category: 'equipment', brand: 'Horizon' },
  { id: 'e5', title: 'Resistance Bands Pro', description: 'Heavy resistance, door anchor.', price: '$59.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://roguefitness.com', category: 'equipment', brand: 'Rogue Fitness' },
  // Recovery
  { id: 'r1', title: 'Massage Gun Pro', description: 'Deep tissue, 5 speeds.', price: '$149', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE20', category: 'recovery' },
  { id: 'r2', title: 'Foam Roller', description: 'High density, 36".', price: '$34.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://onnit.com', category: 'recovery', brand: 'Onnit' },
  { id: 'r3', title: 'Joint Support Complex', description: 'Glucosamine, MSM, collagen.', price: '$29.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://iherb.com', category: 'recovery', brand: 'iHerb' },
  { id: 'r4', title: 'Recovery Supplement', description: 'Tart cherry, curcumin, BCAAs.', price: '$44.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://transparentlabs.com', category: 'recovery', brand: 'Transparent Labs' },
  { id: 'r5', title: 'Knee Compression', description: 'Medical-grade support.', price: '$24.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE21', category: 'recovery' },
  // Nutrition
  { id: 'n1', title: 'Protein Bars 12-Pack', description: '20g protein, low sugar.', price: '$24.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://myprotein.com', category: 'nutrition', brand: 'MyProtein' },
  { id: 'n2', title: 'Meal Replacement Shake', description: '400 cal, 40g protein.', price: '$39.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://optimumnutrition.com', category: 'nutrition', brand: 'Optimum Nutrition' },
  { id: 'n3', title: 'Meal Kit Trial', description: 'High-protein meal plans.', price: '$59.99/wk', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/meals', category: 'nutrition' },
  { id: 'n4', title: 'Beachbody Shakeology', description: 'Superfood protein blend.', price: '$129.95', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://beachbody.com', category: 'nutrition', brand: 'Beachbody' },
  { id: 'n5', title: 'Casein Protein', description: 'Slow-release, before bed.', price: '$42.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://optimumnutrition.com', category: 'nutrition', brand: 'Optimum Nutrition' },
  // Tech & Tracking
  { id: 'tech1', title: 'Fitness Tracker', description: 'HR, sleep, activity, GPS.', price: '$199', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE22', category: 'tech' },
  { id: 'tech2', title: 'ClassPass', description: 'Gym and studio access.', price: 'From $15/mo', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://classpass.com', category: 'tech', brand: 'ClassPass' },
  { id: 'tech3', title: 'Beachbody On Demand', description: 'Streaming workouts.', price: '$99/year', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://beachbody.com', category: 'tech', brand: 'Beachbody' },
  { id: 'tech4', title: 'Macro Tracking App', description: 'Premium subscription.', price: '$49.99/yr', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/macro', category: 'tech' },
  { id: 'tech5', title: 'Smartwatch Pro', description: 'Advanced fitness metrics.', price: '$349', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE23', category: 'tech' },
  // Education
  { id: 'ed1', title: 'Bodybuilding Bible', description: 'Complete guide ebook.', price: '$19.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://bodybuilding.com', category: 'education', brand: 'Bodybuilding.com' },
  { id: 'ed2', title: 'Nutrition Course', description: 'Certified sports nutrition.', price: '$149', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://muscleandstrength.com', category: 'education', brand: 'Muscle & Strength' },
  { id: 'ed3', title: 'Training Ebook', description: 'Hypertrophy science.', price: '$29', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://onnit.com', category: 'education', brand: 'Onnit' },
  { id: 'ed4', title: 'Supplement Guide', description: 'Evidence-based supplement use.', price: '$14.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/guide', category: 'education' },
  { id: 'ed5', title: 'Recovery Handbook', description: 'Sleep, stress, nutrition.', price: '$24.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/recovery', category: 'education' },
  // Health Services
  { id: 'hs1', title: 'Sleep Aid Supplement', description: 'Melatonin, magnesium, L-theanine.', price: '$19.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://iherb.com', category: 'health_services', brand: 'iHerb' },
  { id: 'hs2', title: 'Mental Health App', description: 'CBT, meditation, mood tracking.', price: 'From $9.99/mo', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://example.com/mental', category: 'health_services' },
  { id: 'hs3', title: 'Stress Support', description: 'Adaptogens, ashwagandha.', price: '$29.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://transparentlabs.com', category: 'health_services', brand: 'Transparent Labs' },
  { id: 'hs4', title: 'Sleep Tracker', description: 'Wearable sleep analysis.', price: '$149', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://amazon.com/dp/B00EXAMPLE24', category: 'health_services' },
  { id: 'hs5', title: 'Relaxation Supplement', description: 'GABA, glycine, chamomile.', price: '$24.99', imageUrl: '/api/placeholder/200/200', affiliateUrl: 'https://iherb.com', category: 'health_services', brand: 'iHerb' },
]
