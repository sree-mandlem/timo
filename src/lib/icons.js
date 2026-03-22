import {
  Briefcase, Book, BookOpen, Car, Code2, Coffee, Dumbbell,
  Heart, Home, Mail, Moon, Music, Phone, Smartphone, ShoppingCart,
  Star, Stethoscope, Sun, Tv, Users, UtensilsCrossed,
  Pencil, Plane, Baby, Dog, Bike, Camera, Calendar,
  Clock, CreditCard, FileText, Folder, Globe, Headphones,
  Laptop, MapPin, Mic, Package, Scissors, Shirt, Smile,
  Target, Wallet, Wrench, Zap, BrainCircuit, MessageSquare,
  Bath, Beer, Wine, ChefHat, Flame, BrushCleaning, Sparkles, Toilet, CookingPot,
  Youtube, Bus, Train, TramFront, Clapperboard, Popcorn, Monitor,
  Apple, Banana, Cherry, Grape,
  Citrus, Egg, EggFried, Fish, Beef, Drumstick, Ham,
  PersonStanding, Brain, Glasses, Eye, X, Ban, Trash,
  Kanban, Presentation, PartyPopper, Timer, Vote, Video,
} from 'lucide-react'

const KEYWORD_MAP = [
  // Meetings / people
  { keys: ['meet', 'standup', 'sync', 'interview', 'team', '1:1', 'one on one'], icon: 'Users', component: Users },
  { keys: ['video call', 'zoom', 'teams', 'google meet', 'webex', 'video meeting'], icon: 'Video', component: Video },
  { keys: ['sprint', 'kanban', 'scrum', 'backlog', 'board', 'agile', 'jira'], icon: 'Kanban', component: Kanban },
  { keys: ['demo', 'present', 'presentation', 'slide', 'deck', 'showcase', 'keynote'], icon: 'Presentation', component: Presentation },
  { keys: ['retro', 'retrospective', 'vote', 'poll', 'voting'], icon: 'Vote', component: Vote },
  { keys: ['daily', 'standup', 'timer', 'timebox'], icon: 'Timer', component: Timer },
  { keys: ['event', 'party', 'celebration', 'birthday', 'anniversary', 'festival'], icon: 'PartyPopper', component: PartyPopper },
  { keys: ['phone', 'dial', 'ring'], icon: 'Phone', component: Phone },
  { keys: ['mobile', 'smartphone', 'iphone', 'android', 'text', 'whatsapp'], icon: 'Smartphone', component: Smartphone },
  { keys: ['message', 'chat', 'slack', 'dm'], icon: 'MessageSquare', component: MessageSquare },
  // Food / drink
  { keys: ['eat', 'lunch', 'dinner', 'breakfast', 'brunch', 'meal', 'food', 'snack', 'restaurant', 'cook', 'cooking'], icon: 'UtensilsCrossed', component: UtensilsCrossed },
  { keys: ['coffee', 'tea', 'café', 'cafe', 'drink'], icon: 'Coffee', component: Coffee },
  // Exercise / health
  { keys: ['gym', 'workout', 'exercise', 'run', 'running', 'jog', 'lift', 'weights', 'training', 'fitness'], icon: 'Dumbbell', component: Dumbbell },
  { keys: ['stretch', 'stretching', 'yoga', 'surya', 'namaskar', 'namaskara', 'salutation', 'asana'], icon: 'PersonStanding', component: PersonStanding },
  { keys: ['meditat', 'mindful', 'breathe', 'breathing', 'calm', 'relax', 'relaxation'], icon: 'Brain', component: Brain },
  { keys: ['glasses', 'specs', 'spectacles', 'spects', 'eyewear', 'lens', 'contact lens'], icon: 'Glasses', component: Glasses },
  { keys: ['eye', 'eyes', 'vision', 'sight'], icon: 'Eye', component: Eye },
  { keys: ['cancel', 'cross', 'close', 'no', 'nope', 'skip', 'x mark'], icon: 'X', component: X },
  { keys: ['ban', 'do not enter', 'no entry', 'forbidden', 'prohibited', 'blocked', 'restrict'], icon: 'Ban', component: Ban },
  { keys: ['trash', 'garbage', 'junk', 'dispose', 'bin', 'dustbin', 'throw'], icon: 'Trash', component: Trash },
  { keys: ['bike', 'cycling', 'cycle'], icon: 'Bike', component: Bike },
  { keys: ['doctor', 'health', 'clinic', 'hospital', 'medicine', 'medication', 'dentist', 'therapy'], icon: 'Stethoscope', component: Stethoscope },
  { keys: ['heart', 'love', 'relationship'], icon: 'Heart', component: Heart },
  // Work / productivity
  { keys: ['code', 'coding', 'dev', 'develop', 'pr', 'review', 'debug', 'build', 'deploy', 'commit', 'git'], icon: 'Code2', component: Code2 },
  { keys: ['write', 'writing', 'blog', 'draft', 'essay', 'note', 'notes'], icon: 'Pencil', component: Pencil },
  { keys: ['email', 'inbox', 'mail'], icon: 'Mail', component: Mail },
  { keys: ['report', 'doc', 'document', 'file'], icon: 'FileText', component: FileText },
  { keys: ['work', 'office', 'job', 'task', 'project'], icon: 'Briefcase', component: Briefcase },
  { keys: ['brain', 'think', 'plan', 'planning', 'strategy', 'brainstorm'], icon: 'BrainCircuit', component: BrainCircuit },
  { keys: ['target', 'goal', 'focus'], icon: 'Target', component: Target },
  // Learning
  { keys: ['read', 'book', 'study', 'learn', 'research', 'course', 'class'], icon: 'BookOpen', component: BookOpen },
  { keys: ['listen', 'podcast', 'audio'], icon: 'Headphones', component: Headphones },
  { keys: ['watch', 'video', 'youtube', 'netflix', 'movie', 'film'], icon: 'Tv', component: Tv },
  // Travel / commute
  { keys: ['commute', 'drive', 'car'], icon: 'Car', component: Car },
  { keys: ['bus', 'transit', 'public transport'], icon: 'Bus', component: Bus },
  { keys: ['train', 'metro', 'subway', 'rail'], icon: 'Train', component: Train },
  { keys: ['tram', 'streetcar'], icon: 'TramFront', component: TramFront },
  { keys: ['travel', 'trip', 'flight', 'fly'], icon: 'Plane', component: Plane },
  { keys: ['walk', 'stroll', 'hike'], icon: 'MapPin', component: MapPin },
  // Home / personal
  { keys: ['home', 'house', 'clean', 'cleaning', 'chore', 'laundry', 'dishes'], icon: 'Home', component: Home },
  { keys: ['shop', 'buy', 'purchase', 'grocery', 'groceries', 'store'], icon: 'ShoppingCart', component: ShoppingCart },
  { keys: ['kid', 'child', 'baby', 'childcare', 'school', 'pickup', 'drop off'], icon: 'Baby', component: Baby },
  { keys: ['pet', 'dog', 'cat', 'walk the dog'], icon: 'Dog', component: Dog },
  // Hygiene
  { keys: ['bath', 'shower', 'bathe', 'bathing'], icon: 'Bath', component: Bath },
  { keys: ['brush teeth', 'teeth', 'dental', 'floss', 'brushing'], icon: 'BrushCleaning', component: BrushCleaning },
  { keys: ['toilet', 'poop', 'loo', 'wc', 'bathroom'], icon: 'Toilet', component: Toilet },
  // Food & drink
  { keys: ['cook', 'cooking', 'bake', 'baking'], icon: 'CookingPot', component: CookingPot },
  { keys: ['grill', 'grilling', 'bbq', 'barbecue'], icon: 'Flame', component: Flame },
  { keys: ['beer', 'pub', 'brewery', 'ale', 'lager'], icon: 'Beer', component: Beer },
  { keys: ['wine', 'winery', 'vineyard', 'vino'], icon: 'Wine', component: Wine },
  // Fruits
  { keys: ['banana', 'bananas'], icon: 'Banana', component: Banana },
  { keys: ['cherry', 'cherries'], icon: 'Cherry', component: Cherry },
  { keys: ['grape', 'grapes'], icon: 'Grape', component: Grape },
  { keys: ['apple', 'fruit', 'fruits', 'mango', 'peach', 'pear', 'melon', 'watermelon', 'strawberry', 'blueberry', 'raspberry', 'avocado', 'pineapple', 'coconut', 'papaya', 'plum'], icon: 'Apple', component: Apple },
  { keys: ['orange', 'kiwi', 'lemon', 'lime', 'citrus', 'grapefruit', 'tangerine', 'mandarin'], icon: 'Citrus', component: Citrus },
  // Eggs & omelette
  { keys: ['omelette', 'omelet', 'fried egg', 'scrambled', 'sunny side'], icon: 'EggFried', component: EggFried },
  { keys: ['egg', 'eggs', 'boiled egg', 'poached'], icon: 'Egg', component: Egg },
  // Fish & meat
  { keys: ['fish', 'salmon', 'tuna', 'cod', 'seafood', 'sushi', 'tilapia', 'sardine', 'mackerel'], icon: 'Fish', component: Fish },
  { keys: ['beef', 'steak', 'burger', 'hamburger'], icon: 'Beef', component: Beef },
  { keys: ['chicken', 'drumstick', 'wings', 'turkey', 'poultry'], icon: 'Drumstick', component: Drumstick },
  { keys: ['meat', 'pork', 'ham', 'bacon', 'sausage', 'lamb', 'mutton', 'ribs'], icon: 'Ham', component: Ham },
  // Entertainment
  { keys: ['youtube', 'netflix', 'stream', 'streaming', 'prime', 'disney', 'hbo', 'series', 'show', 'episode'], icon: 'Youtube', component: Youtube },
  { keys: ['movie', 'film', 'cinema', 'watch', 'tv', 'television'], icon: 'Clapperboard', component: Clapperboard },
  { keys: ['screen', 'display', 'monitor'], icon: 'Monitor', component: Monitor },
  { keys: ['popcorn', 'movie night'], icon: 'Popcorn', component: Popcorn },
  { keys: ['music', 'play', 'sing', 'guitar', 'piano', 'practice'], icon: 'Music', component: Music },
  { keys: ['photo', 'photography', 'camera', 'shoot'], icon: 'Camera', component: Camera },
  // Finance
  { keys: ['pay', 'payment', 'bill', 'invoice', 'budget', 'finance', 'bank', 'expense'], icon: 'CreditCard', component: CreditCard },
  { keys: ['wallet', 'money', 'cash'], icon: 'Wallet', component: Wallet },
  // Other
  { keys: ['sleep', 'nap', 'rest', 'bed'], icon: 'Moon', component: Moon },
  { keys: ['morning', 'wake', 'sunrise'], icon: 'Sun', component: Sun },
  { keys: ['social', 'friend', 'friends', 'party', 'hang'], icon: 'Smile', component: Smile },
  { keys: ['fix', 'repair', 'maintain', 'maintenance'], icon: 'Wrench', component: Wrench },
  { keys: ['laptop', 'computer', 'mac', 'pc'], icon: 'Laptop', component: Laptop },
  { keys: ['star', 'favourite', 'favorite', 'important'], icon: 'Star', component: Star },
  { keys: ['calendar', 'schedule', 'appointment'], icon: 'Calendar', component: Calendar },
  { keys: ['power', 'energy', 'charge'], icon: 'Zap', component: Zap },
  { keys: ['package', 'delivery', 'order', 'ship'], icon: 'Package', component: Package },
  { keys: ['cut', 'hair', 'barber', 'salon'], icon: 'Scissors', component: Scissors },
  { keys: ['wear', 'clothes', 'outfit', 'dress', 'iron', 'ironing'], icon: 'Shirt', component: Shirt },
  { keys: ['mic', 'record', 'studio', 'interview'], icon: 'Mic', component: Mic },
  { keys: ['world', 'web', 'internet', 'browse'], icon: 'Globe', component: Globe },
  { keys: ['folder', 'organize', 'archive'], icon: 'Folder', component: Folder },
]

/**
 * Infer an icon name from task text. Returns { icon, component } or null.
 */
export function inferIcon(text) {
  if (!text || text.trim().length < 2) return null
  const lower = text.toLowerCase()
  for (const entry of KEYWORD_MAP) {
    if (entry.keys.some(k => lower.includes(k))) {
      return { icon: entry.icon, component: entry.component }
    }
  }
  return null
}

/**
 * Get a Lucide component by icon name string.
 */
export function getIconComponent(iconName) {
  const entry = KEYWORD_MAP.find(e => e.icon === iconName)
  return entry?.component ?? Clock
}

export { Clock }

export const ALL_ICONS = KEYWORD_MAP.map(e => ({ name: e.icon, component: e.component }))
