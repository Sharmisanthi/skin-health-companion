-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  hospital TEXT,
  location TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  rating DECIMAL(2,1) DEFAULT 4.5,
  consultation_fee DECIMAL(10,2),
  available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  available_time_start TIME DEFAULT '09:00',
  available_time_end TIME DEFAULT '17:00',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disease categories table
CREATE TABLE public.disease_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diseases table
CREATE TABLE public.diseases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.disease_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  symptoms TEXT[],
  remedies TEXT[],
  when_to_see_doctor TEXT,
  prevention TEXT[],
  image_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create detection history table
CREATE TABLE public.detection_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  detected_disease_id UUID REFERENCES public.diseases(id),
  detected_disease_name TEXT,
  confidence_score DECIMAL(5,2),
  ai_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  disease_id UUID REFERENCES public.diseases(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  symptoms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for doctors (publicly viewable)
CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update their own profile" ON public.doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Doctors can insert their own profile" ON public.doctors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for disease_categories (publicly viewable)
CREATE POLICY "Anyone can view disease categories" ON public.disease_categories FOR SELECT USING (true);

-- RLS Policies for diseases (publicly viewable)
CREATE POLICY "Anyone can view diseases" ON public.diseases FOR SELECT USING (true);

-- RLS Policies for detection_history
CREATE POLICY "Users can view their own detection history" ON public.detection_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own detection history" ON public.detection_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for appointments
CREATE POLICY "Patients can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view appointments assigned to them" ON public.appointments FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctors WHERE doctors.id = appointments.doctor_id AND doctors.user_id = auth.uid()));
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can update appointments assigned to them" ON public.appointments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.doctors WHERE doctors.id = appointments.doctor_id AND doctors.user_id = auth.uid()));

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert disease categories
INSERT INTO public.disease_categories (name, description, icon, order_index) VALUES
('Infectious Skin Diseases', 'Caused by bacteria, viruses, fungi, or parasites', 'Bug', 1),
('Inflammatory & Allergic', 'Due to immune reaction or allergy', 'Flame', 2),
('Acne & Sebaceous', 'Related to oil glands', 'Droplet', 3),
('Pigmentation Disorders', 'Affect skin color', 'Palette', 4),
('Genetic & Congenital', 'Present from birth or inherited', 'Dna', 5),
('Autoimmune Diseases', 'Immune system attacks the skin', 'Shield', 6),
('Hair & Scalp Disorders', 'Affect hair growth and scalp', 'Scissors', 7),
('Nail Disorders', 'Affect fingernails and toenails', 'Hand', 8),
('Skin Tumors & Cancers', 'Abnormal growth of skin cells', 'AlertTriangle', 9),
('Other Conditions', 'Common skin conditions', 'MoreHorizontal', 10);

-- Insert sample diseases with remedies
INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention) 
SELECT id, 'Impetigo', 'Highly contagious bacterial skin infection', 
  ARRAY['Red sores', 'Blisters that ooze', 'Honey-colored crusts', 'Itching'],
  ARRAY['Keep affected area clean', 'Apply antibiotic ointment', 'Cover with bandage', 'Wash hands frequently', 'Avoid scratching'],
  'If sores spread, fever develops, or no improvement in 3 days',
  ARRAY['Good hygiene', 'Avoid sharing towels', 'Keep cuts clean', 'Wash hands regularly']
FROM public.disease_categories WHERE name = 'Infectious Skin Diseases';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Ringworm', 'Fungal infection causing ring-shaped rash',
  ARRAY['Ring-shaped rash', 'Red scaly border', 'Clear center', 'Itching', 'Hair loss in area'],
  ARRAY['Apply antifungal cream', 'Keep area dry', 'Avoid sharing personal items', 'Wash bedding frequently', 'Use antifungal powder'],
  'If rash persists after 2 weeks of treatment or spreads',
  ARRAY['Keep skin dry', 'Wear loose clothing', 'Do not share personal items', 'Shower after exercise']
FROM public.disease_categories WHERE name = 'Infectious Skin Diseases';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Eczema', 'Chronic condition causing itchy, inflamed skin',
  ARRAY['Dry skin', 'Itching', 'Red patches', 'Cracked skin', 'Oozing or crusting'],
  ARRAY['Moisturize regularly', 'Use mild soaps', 'Apply hydrocortisone cream', 'Take antihistamines for itching', 'Avoid triggers'],
  'If symptoms are severe, infected, or not responding to home treatment',
  ARRAY['Identify and avoid triggers', 'Use fragrance-free products', 'Keep skin moisturized', 'Avoid hot showers']
FROM public.disease_categories WHERE name = 'Inflammatory & Allergic';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Psoriasis', 'Autoimmune condition causing rapid skin cell growth',
  ARRAY['Red patches with silvery scales', 'Dry cracked skin', 'Itching', 'Burning sensation', 'Thickened nails'],
  ARRAY['Moisturize daily', 'Use medicated creams', 'Get sunlight exposure', 'Avoid triggers', 'Reduce stress'],
  'If symptoms are widespread, painful, or affecting quality of life',
  ARRAY['Manage stress', 'Avoid skin injuries', 'Limit alcohol', 'Maintain healthy weight']
FROM public.disease_categories WHERE name = 'Inflammatory & Allergic';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Acne Vulgaris', 'Common skin condition causing pimples and blemishes',
  ARRAY['Blackheads', 'Whiteheads', 'Pimples', 'Cysts', 'Oily skin'],
  ARRAY['Cleanse face twice daily', 'Use benzoyl peroxide', 'Apply salicylic acid', 'Do not pick or squeeze', 'Use non-comedogenic products'],
  'If acne is severe, scarring, or not responding to OTC treatments',
  ARRAY['Wash face regularly', 'Avoid touching face', 'Use oil-free products', 'Change pillowcases often']
FROM public.disease_categories WHERE name = 'Acne & Sebaceous';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Vitiligo', 'Loss of skin color in patches',
  ARRAY['White patches on skin', 'Premature graying of hair', 'Loss of color in mouth', 'Color changes in eyes'],
  ARRAY['Use sunscreen', 'Apply corticosteroid cream', 'Consider light therapy', 'Use camouflage makeup', 'Join support groups'],
  'When white patches first appear or if patches spread',
  ARRAY['Protect skin from sun', 'Avoid skin trauma', 'Manage stress']
FROM public.disease_categories WHERE name = 'Pigmentation Disorders';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Alopecia Areata', 'Autoimmune condition causing hair loss in patches',
  ARRAY['Round bald patches', 'Exclamation point hairs', 'Nail changes', 'Sudden hair loss'],
  ARRAY['Apply minoxidil', 'Consider corticosteroid injections', 'Use hair loss concealers', 'Join support groups', 'Reduce stress'],
  'When hair loss is first noticed or if it spreads',
  ARRAY['Manage stress', 'Eat balanced diet', 'Avoid harsh hair treatments']
FROM public.disease_categories WHERE name = 'Hair & Scalp Disorders';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Nail Fungus', 'Fungal infection of fingernails or toenails',
  ARRAY['Thickened nails', 'Yellow discoloration', 'Brittle nails', 'Distorted shape', 'Dark color under nail'],
  ARRAY['Apply antifungal nail polish', 'Use oral antifungals', 'Keep nails trimmed', 'Wear breathable shoes', 'Use antifungal spray'],
  'If nail becomes painful, spreads, or home treatment fails',
  ARRAY['Keep feet dry', 'Wear proper footwear', 'Do not share nail clippers', 'Choose reputable salons']
FROM public.disease_categories WHERE name = 'Nail Disorders';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Melanoma', 'Most serious type of skin cancer',
  ARRAY['Asymmetrical mole', 'Irregular borders', 'Color variations', 'Large diameter', 'Evolving size or shape'],
  ARRAY['Seek immediate medical attention', 'Follow treatment plan', 'Regular skin checks', 'Sun protection', 'Support groups'],
  'IMMEDIATELY if you notice any suspicious moles or skin changes',
  ARRAY['Use sunscreen SPF 30+', 'Avoid tanning beds', 'Wear protective clothing', 'Regular skin exams']
FROM public.disease_categories WHERE name = 'Skin Tumors & Cancers';

INSERT INTO public.diseases (category_id, name, description, symptoms, remedies, when_to_see_doctor, prevention)
SELECT id, 'Sunburn', 'Skin damage from UV radiation',
  ARRAY['Red painful skin', 'Blisters', 'Peeling', 'Fever', 'Nausea'],
  ARRAY['Apply cool compresses', 'Take cool baths', 'Apply aloe vera', 'Stay hydrated', 'Take pain relievers'],
  'If severe blistering, fever, or signs of infection',
  ARRAY['Use sunscreen SPF 30+', 'Seek shade', 'Wear protective clothing', 'Avoid peak sun hours']
FROM public.disease_categories WHERE name = 'Other Conditions';