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
            description: 'Ženski krug dio je redovnog programa naše udruge čije se radionice održavaju jednom mjesečno, a predstavlja živi intuitivni prostor u kojem sadržaj radionica nastaje putem onoga što sudionice žele izraziti, podijeliti ili iscijeliti, u tom trenutku, zajedno. ',
            imageUrl: 'assets/women.jpg'
          },
          {
            subtitle: '🤝 Programi povezivanja zajednice ',
            description: 'Kroz okupljanja putem igranja društvenih igara, književnog kluba, tematskih rasprava, intuitivnog pisanja i slikanja, outdoor avantura te volontiranja na aktivnostima lokalne zajednice, želimo potaknuti radost međusobnog povezivanja, aktivnog sudjelovanja i pružiti prostor pojedincima da otkriju svoje snage, interese, talente i osjećaj pripadnosti.',
            imageUrl: 'assets/hero (5).jpg'
          }
        ]
      },
      'djeca-i-mladi': {
        title: 'Djeca i mladi',
        podprogrami: [
          {
            subtitle: '🌱 LjUB program ',
            description: 'Certificirani program Ljubav u pokretu provodi se kroz 12 pomno osmišljenih radionica tijekom tri mjeseca. Namijenjen je u unapređenju tjelesnog i emocionalnog zdravlja djece i mladih kroz integraciju elemenata art terapije, terapije plesom i pokretom, psihodrame i edukativnih elemenata. ',
            imageUrl: 'assets/happy(1).jpg'
          },
          {
            subtitle: '📘 Antistres pripreme za maturu ',
            description: 'Radionice se provode od siječnja do svibnja u tjednom ritmu, uživo ili online. Svrha provođenja ovih priprema za maturante razviti je njihove psihološke vještine, kako bi sa što manje stresa, više samopouzdanja i boljom koncentracijom, pristupili ispitima državne mature te postigli što bolje rezultate.',
            imageUrl: 'assets/matura.jpg'
          }
        ]
      },
      'osnazeno-roditeljstvo': {
        title: 'Program za roditelje',
        podprogrami: [
          {
            subtitle: '👨‍👩‍👧‍👦 Osnaženo roditeljstvo',
            description: 'Program Osnaženo roditeljstvo provodi se kao ciklus od šest radionica kroz tri mjeseca. Na susretima interaktivno prolazimo kroz glavnih sadašnjih izazova roditeljstva te nudimo podršku, savjete i alate kojima prvenstveno osnažujete sebe kako bi mogli odgojiti mentalno i emocionalno jako dijete. ',
            imageUrl: 'assets/parents.jpg'
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
