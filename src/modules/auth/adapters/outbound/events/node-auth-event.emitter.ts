import { EventEmitter } from "node:events";
import {
  AuthEventPort,
  UserRegisteredEvent,
} from "../../../application/ports/outbound/auth-event.port";

export class NodeAuthEventEmitter implements AuthEventPort {
  constructor(private readonly emitter: EventEmitter) {}

  async emitUserRegistered(event: UserRegisteredEvent): Promise<void> {
    this.emitter.emit("user.registered", event);
  }
}
