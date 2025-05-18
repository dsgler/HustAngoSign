import { Mutex } from 'async-mutex';

export const cookielock = new Mutex();
