export interface InstantSchema {
  members: {
    nickname: string;
  };
  metrics: {
    name: string;
  };
  logs: {
    value: number;
    timestamp: string;
  };
}
