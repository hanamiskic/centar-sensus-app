import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  // Korištenje EnvironmentInjector-a da sigurno koristimo inject unutar async konteksta
  private injector = inject(EnvironmentInjector);

  // Mali helper da izbjegnemo duplikate poziva
  private async call<T>(name: string, data: unknown): Promise<T> {
    return runInInjectionContext(this.injector, async () => {
      const fns = inject(Functions);
      const callable = httpsCallable(fns, name);
      const res: any = await callable(data ?? {});
      return (res?.data ?? null) as T;
    });
  }

  // Dohvat svih korisnika (admin)
  listUsers(): Promise<any[]> {
    return this.call<any[]>('listUsers', {});
  }

  // Brisanje korisnika po uid-u (admin)
  async deleteUser(uid: string): Promise<void> {
    await this.call<unknown>('deleteUser', { uid });
  }
}
