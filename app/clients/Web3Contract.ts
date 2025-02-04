import { nowTimeString } from '../Utils.js';
import { ContractWrapper, ErrorWrapper, WrapperListener } from '../Types.js';
import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import { WebsocketProvider } from 'web3-core';

export class Web3Contract implements ContractWrapper {
  private primaryEndpoint: string;
  private provider: WebsocketProvider;

  private web3: Web3;
  private contract: Contract;

  private address: string;

  private attempts = 3;
  private attemptTimeoutSeconds = 1;

  constructor(addressOrName: string, contractInterface: any, web3: Web3) {
    this.address = addressOrName;
    this.contract = new web3.eth.Contract(contractInterface, addressOrName);
  }

  private toString(): string {
    return `EthersContract: (rpc=${this.primaryEndpoint})`;
  }

  private clog(...args) {
    console.log(`>>> ${nowTimeString()} >>> Network${this.toString()}:`, ...args);
  }

  private err(...args): Error {
    return new Error(`NetworkError${this.toString()}: ${args.join(' ')}`);
  }

  public getNativeContract(): Contract {
    return this.contract;
  }

  public getDefaultProvider(): WebsocketProvider {
    if (!this.provider) {
      throw this.err('Provider not initialized');
    }
    return this.provider;
  }

  public ethCall(method: string, args: any[], overrides: object): any {
    if (!(method in this.contract)) {
      throw this.err(`Contract ${this.address} doesn't have method '${method}' in the provided abi.`)
    }
    let errorCounter = this.attempts;

    do {
      try {
        return this.contract[method](...args, overrides);
      } catch (e) {
        this.clog(`Error querying method '${method}' with arguments ${JSON.stringify(args)} and overrides ${overrides}: ${e}`);
      }
    } while (errorCounter-- > 0)
  }

  decodeError(response: string): ErrorWrapper {
    return undefined;
  }

  ethCallStatic(method: string, args?: any[], overrides?: object): Promise<any> {
    return Promise.resolve(undefined);
  }

  public encodeABI(method: string, args = []): string {
    if (!(method in this.contract.methods)) {
      throw this.err(`Contract ${this.address} doesn't have method '${method}' in the provided abi.`)
    }
    return this.contract.methods[method](args).encodeABI();
  }

  getPastEvents(eventName: string, from: number, to: number): Promise<any[]> {
    return Promise.resolve([]);
  }

  on(eventName: string, eventEmittedCallback: WrapperListener): ContractWrapper {
    this.contract.events[eventName]({}).on('data', (error, event) => {
      console.log('got event', eventName);
    });
    return this;
  }
}
