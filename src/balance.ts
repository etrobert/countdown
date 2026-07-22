export type Card = {
  id: string;
  name: string;
  cost: number;
  atk: number;
  hp: number;
};

export const HAND_SIZE = 5;

export const DECK_SIZE = 15;

export const CARDS: Card[] = [
  { id: "runner", name: "Runner", cost: 1, atk: 1, hp: 1 },
  { id: "sentry", name: "Sentry", cost: 2, atk: 1, hp: 4 },
  { id: "lash", name: "Lash", cost: 3, atk: 3, hp: 2 },
  { id: "zealot", name: "Zealot", cost: 3, atk: 5, hp: 3 },
  { id: "colossus", name: "Colossus", cost: 5, atk: 4, hp: 6 },
];
