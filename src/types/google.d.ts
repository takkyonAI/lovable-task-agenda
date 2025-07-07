
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
        };
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

export {};
