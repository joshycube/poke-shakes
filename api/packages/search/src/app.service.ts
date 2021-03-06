import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';

import { Pokemon } from './schemas/pokemon.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Pokemon.name) private pokemonModel: Model<Pokemon>,
    @Inject('TranslationService') private client: ClientProxy,
  ) { }

  private async translateMsg(name: string): Promise<any> {
    try {
      const pattern = { cmd: 'translate' };
      const msg = this.client.send<string>(pattern, name);
      const result = await msg.toPromise();
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async getPokemon(name: string): Promise<Pokemon> {
    let pokemonResult = await this.pokemonModel.findOne({ name }).exec();

    if (pokemonResult !== null) {
      return pokemonResult;
    }

    try {
      const result = await this.translateMsg(name);

      // TODO better error handler

      if (result === 404) {
        throw new NotFoundException('E000001');
      }

      if (result) {
        pokemonResult = await this.pokemonModel.findById(result).exec();
      }
    } catch (error) {
      throw error;
    }

    return pokemonResult;
  }
}
