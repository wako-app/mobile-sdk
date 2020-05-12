export interface WakoDebugLog {
  category: string;
  date: Date;
  data: string;
}

export class WakoDebugService {
  static logs: WakoDebugLog[] = [];

  static log(category: string, ...data: any[]) {
    console.log(`${new Date().toISOString()} - [${category}]:`, data.join(' '));

    this.logs.push({
      category: category,
      date: new Date(),
      data: data.join(' '),
    });
  }
}
