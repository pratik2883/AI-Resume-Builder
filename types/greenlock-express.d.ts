declare module 'greenlock-express' {
  import { Server } from 'http';

  interface GreenlockOptions {
    packageRoot: string;
    configDir: string;
    maintainerEmail: string;
    cluster: boolean;
    staging?: boolean;
  }

  interface GreenlockManager {
    defaults(options: {
      subscriberEmail: string;
      agreeToTerms: boolean;
      renewOffset: string;
      renewStagger: string;
    }): void;
  }

  interface GreenlockInstance {
    manager: GreenlockManager;
    add(options: {
      subject: string;
      altnames: string[];
    }): void;
    httpServer(): Server;
  }

  function init(options: GreenlockOptions): GreenlockInstance;

  const greenlock: {
    init: typeof init
  };
  
  export default greenlock;
}