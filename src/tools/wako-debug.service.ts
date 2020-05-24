export interface WakoDebugLog {
  category: string;
  date: Date;
  data: string;
}

export class WakoDebugService {
  static logs: WakoDebugLog[] = [];

  static log(category: string, ...data: any[]) {
    const logs = [];
    for (const d of data) {
      if (typeof d === 'object') {
        logs.push(JSON.stringify(d));
      } else {
        logs.push(d);
      }
    }
    console.log(`${new Date().toISOString()} - [${category}]:`, logs.join(' '));

    this.logs.push({
      category: category,
      date: new Date(),
      data: logs.join(' '),
    });
  }
}
