// src/app/services/admin-users.service.ts
import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private injector = inject(EnvironmentInjector); // ⬅️

  listUsers() {
    return runInInjectionContext(this.injector, async () => {
      const fns = inject(Functions);
      const callable = httpsCallable(fns, 'listUsers');
      const res: any = await callable({});
      return res.data as any[];
    });
  }

  deleteUser(uid: string) {
    return runInInjectionContext(this.injector, async () => {
      const fns = inject(Functions);
      const callable = httpsCallable(fns, 'deleteUser');
      await callable({ uid });
      return true;
    });
  }
}
