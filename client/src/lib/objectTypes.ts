export type ObjectCategory = 'shapes' | 'fruits' | 'emojis';
export type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'heart';
export type FruitType = 'apple' | 'banana' | 'orange' | 'watermelon' | 'grape' | 'strawberry';
export type EmojiType = 'smile' | 'sad' | 'angry' | 'cool' | 'love' | 'starface';
export type ObjectType = ShapeType | FruitType | EmojiType;
export type ColorType = 'red' | 'blue' | 'green' | 'yellow';

export interface ObjectConfig {
  category: ObjectCategory;
  type: ObjectType;
  sound: string;
  emoji?: string;
}

export const OBJECT_CONFIGS: Record<string, ObjectConfig> = {
  circle: { category: 'shapes', type: 'circle', sound: 'pop' },
  square: { category: 'shapes', type: 'square', sound: 'pop' },
  triangle: { category: 'shapes', type: 'triangle', sound: 'pop' },
  star: { category: 'shapes', type: 'star', sound: 'whoosh' },
  heart: { category: 'shapes', type: 'heart', sound: 'pop' },
  
  apple: { category: 'fruits', type: 'apple', sound: 'crunch', emoji: '🍎' },
  banana: { category: 'fruits', type: 'banana', sound: 'squish', emoji: '🍌' },
  orange: { category: 'fruits', type: 'orange', sound: 'splash', emoji: '🍊' },
  watermelon: { category: 'fruits', type: 'watermelon', sound: 'splash', emoji: '🍉' },
  grape: { category: 'fruits', type: 'grape', sound: 'pop', emoji: '🍇' },
  strawberry: { category: 'fruits', type: 'strawberry', sound: 'squish', emoji: '🍓' },
  
  smile: { category: 'emojis', type: 'smile', sound: 'laugh', emoji: '😊' },
  sad: { category: 'emojis', type: 'sad', sound: 'cry', emoji: '😢' },
  angry: { category: 'emojis', type: 'angry', sound: 'grunt', emoji: '😠' },
  cool: { category: 'emojis', type: 'cool', sound: 'yeah', emoji: '😎' },
  love: { category: 'emojis', type: 'love', sound: 'kiss', emoji: '😍' },
  starface: { category: 'emojis', type: 'starface', sound: 'sparkle', emoji: '🤩' },
};

export const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle', 'star', 'heart'];
export const FRUIT_TYPES: FruitType[] = ['apple', 'banana', 'orange', 'watermelon', 'grape', 'strawberry'];
export const EMOJI_TYPES: EmojiType[] = ['smile', 'sad', 'angry', 'cool', 'love', 'starface'];
export const ALL_OBJECT_TYPES: ObjectType[] = [...SHAPE_TYPES, ...FRUIT_TYPES, ...EMOJI_TYPES];

export function getRandomObjectType(category?: ObjectCategory): ObjectType {
  if (category === 'shapes') {
    return SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
  } else if (category === 'fruits') {
    return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
  } else if (category === 'emojis') {
    return EMOJI_TYPES[Math.floor(Math.random() * EMOJI_TYPES.length)];
  } else {
    return ALL_OBJECT_TYPES[Math.floor(Math.random() * ALL_OBJECT_TYPES.length)];
  }
}

export function getObjectConfig(type: ObjectType): ObjectConfig {
  return OBJECT_CONFIGS[type];
}
