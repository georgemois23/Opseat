import { User } from "@/features/auth/types/auth.types";
import { DayOfWeek } from "./dayOfWeek";

export interface Restaurant {
  id: string;
  publicId: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country?: string;

  latitude?: number;
  longitude?: number;

  deliveryRadius: number;

  staff: RestaurantUser[];

  isDelivering: boolean;

  schedules: RestaurantSchedule[];

  categories: GreekRestaurantCategory[];

  slug?: string;

  /** Cover / hero image for listings (optional). */
  imageUrl?: string;
  outOfRange?: boolean;
  minimumOrderAmount: number;

  menus: Menu[];
}

export enum RestaurantRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  STAFF = 'staff'
}

export interface RestaurantUser {
  id: string;
  user: User;
  restaurant: Restaurant;
  role: RestaurantRole;
}

export interface RestaurantSchedule {
  id: string;
  dayOfWeek: DayOfWeek;
  openTime: string;   // "HH:mm:ss"
  closeTime: string;
  isClosed: boolean;
  restaurant: Restaurant;
}

export enum GreekRestaurantCategory {
  SOUVLAKI = 'souvlaki',
  GYROS = 'gyros',
  BURGERS = 'burgers',
  PIZZA = 'pizza',
  PASTA = 'pasta',
  SEAFOOD = 'seafood',
  FISH = 'fish',
  MEAT = 'meat',
  KEBAB = 'kebab',
  SALADS = 'salads',
  BREAKFAST = 'breakfast',
  CAFE = 'cafe',
  COFFEE = 'coffee',
  DESSERTS = 'desserts',
  ICE_CREAM = 'ice_cream',
  JUICES = 'juices',
  SMOOTHIES = 'smoothies',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  FAST_FOOD = 'fast_food',
  STREET_FOOD = 'street_food',
  SANDWICHES = 'sandwiches',
  WRAPS = 'wraps',
  PANCAKES = 'pancakes',
  WAFFLES = 'waffles',
  DONUTS = 'donuts',
  PIES = 'pies',
  BAKERY = 'bakery',
  GREEK_TRADITIONAL = 'greek_traditional', // like moussaka, pastitsio
  MEDITERRANEAN = 'mediterranean',
  ASIAN = 'asian', // includes sushi, chinese, thai
  SUSHI = 'sushi',
  CHINESE = 'chinese',
  FAST_DRINKS = 'fast_drinks',
  BEER = 'beer',
  WINE = 'wine',
  COCKTAILS = 'cocktails',
}

export interface Menu {
  id: string;
  restaurant: Restaurant;
  name: string;
  active: boolean;
  categories: Category[];
}

export interface Category {
  id: string
  menu: Menu;
  name: string;
  order: number;
  active: boolean;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  category: Category;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  isSoldOut?: boolean;
  ingredients: MenuItemIngredient[]
}

export interface MenuItemIngredient {
  id: string;
  ingredient: Ingredient;
  quantity?: number;
  required: boolean;
}

export interface Ingredient {
id: string;
  name: string;  
  category: IngredientCategory;
  available: boolean;
}

export enum IngredientCategory {
  SAUCE = 'sauce',
  MEAT = 'meat',
  CHEESE = 'cheese',
  VEGETABLE = 'vegetable',
  BREAD = 'bread',
  DRINK_BASE = 'drink_base',
  COFFEE = 'coffee',
  SPICE = 'spice',
  OTHER = 'other',
}