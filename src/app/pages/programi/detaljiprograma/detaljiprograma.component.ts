import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';


interface PodProgram {
  subtitle: string;
  description: string;
  imageUrl: string;
}

@Component({
  selector: 'app-detalji-programa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detaljiprograma.component.html',
  styleUrls: ['./detaljiprograma.component.css']
})
export class DetaljiProgramaComponent implements OnInit {
  programId: string = '';
  title: string = '';
  podprogrami: PodProgram[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.programId = this.route.snapshot.paramMap.get('id') || '';

    const podaci: Record<string, { title: string; podprogrami: PodProgram[] }> = {
      'programi-za-odrasle': {
        title: 'Programi za odrasle',
        podprogrami: [
          {
            subtitle: '🌸 Ženski krug',
            description: 'Radionice i edukacije usmjerene na samopouzdanje, emocionalnu otpornost i unutarnju snagu.',
            imageUrl: '/women.jpg'
          },
          {
            subtitle: '🤝 Programi povezivanja zajednice ',
            description: 'Kroz okupljanja putem igranja društvenih igara, književnog kluba, tematskih rasprava, intuitivnog pisanja i slikanja, outdoor avantura te volontiranja na aktivnostima lokalne zajednice, želimo potaknuti radost međusobnog povezivanja, aktivnog sudjelovanja i pružiti prostor pojedincima da otkriju svoje snage, interese, talente i osjećaj pripadnosti.',
            imageUrl: '/hero (5).jpg'
          }
        ]
      },
      'djeca-i-mladi': {
        title: 'Djeca i mladi',
        podprogrami: [
          {
            subtitle: '🌱 Razvoj samopoštovanja',
            description: 'Podrška djeci i mladima u izgradnji identiteta i emocionalnih vještina.',
            imageUrl: '/happy.jpg'
          },
          {
            subtitle: '📘 Antistres pripreme za maturu ',
            description: 'Radionice se provode od siječnja do svibnja u tjednom ritmu, uživo ili online. Svrha provođenja ovih priprema za maturante razviti je njihove psihološke vještine, kako bi sa što manje stresa, više samopouzdanja i boljom koncentracijom, pristupili ispitima državne mature te postigli što bolje rezultate.',
            imageUrl: '/matura.jpg'
          }
        ]
      },
      'osnazeno-roditeljstvo': {
        title: 'Osnaženo roditeljstvo',
        podprogrami: [
          {
            subtitle: '👨‍👩‍👧‍👦 Edukacije i podrška',
            description: 'Savjeti, resursi i radionice za izazove roditeljstva u modernom društvu.',
            imageUrl: '/parents.jpg'
          }
        ]
      }
    };

    const selected = podaci[this.programId];
    if (selected) {
      this.title = selected.title;
      this.podprogrami = selected.podprogrami;
    }
  }

  goBack(): void {
  this.router.navigate(['/']);
}
}
