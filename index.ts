interface RequestType {
  method: typeof HTTP_POST_METHOD | typeof HTTP_GET_METHOD;
  host: string;
  path: string;
  body?: Record<string, unknown>;
  params: Record<string, string>;
}

interface Handlers {
  next: (value: RequestType) => {};
  error: (error: Error) => {};
  complete: () => void;
}

type Subscribe = (observer: Observer) => () => void;

class Observer {
  isUnsubscribed: boolean;
  _unsubscribe: () => void;

  constructor(private handlers: Handlers) {
    this.isUnsubscribed = false;
  }

  next(value: RequestType) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: Error) {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {
  constructor(private _subscribe: Subscribe) {}

  static from(values: Array<RequestType>) {
    return new Observable((observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(obs: Handlers) {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const HTTP_POST_METHOD = "POST";
const HTTP_GET_METHOD = "GET";

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const userMock = {
  name: "User Name",
  age: 26,
  roles: ["user", "admin"],
  createdAt: new Date(),
  isDeleated: false,
};

const requestsMock: Array<RequestType> = [
  {
    method: HTTP_POST_METHOD,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: HTTP_GET_METHOD,
    host: "service.example",
    path: "user",
    params: {
      id: "3f5h67s4s",
    },
  },
];

const handleRequest = (request: RequestType) => {
  // handling of request
  return { status: HTTP_STATUS_OK };
};
const handleError = (error: Error) => {
  // handling of error
  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = () => console.log("complete");

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
