/**
 * Life outside work, in Nadun's words (27 Nov 2026), grouped by the threads
 * that run through them. Chatbot only for now: it goes into knowledge.md
 * (CLAUDE.md 8.7) and isn't shown on the page.
 */

export type InterestGroup = {
  label: string;
  /** Plain sentences about Nadun, third person (the chatbot quotes them). */
  lines: string[];
  /** His favourites in this group, as he listed them. */
  favourites?: { label: string; items: string[] }[];
};

export const interests: { summary: string; groups: InterestGroup[] } = {
  summary:
    "Three threads run through what Nadun does for fun: competition and discipline (cricket, combat sports and the athletes he follows), machines and speed (racing, and fixing bikes and cars), and stories about character under pressure, where faith, loyalty and the cost of choices matter.",
  groups: [
    {
      label: "Right now",
      lines: ["He currently works as an e-bike mechanic for Lime."],
    },
    {
      label: "Cricket",
      lines: [
        "He plays and watches cricket.",
        "He supports both the Sri Lankan and the Australian cricket teams, and he won't choose between them, so don't ask him to.",
      ],
    },
    {
      label: "Training",
      lines: [
        "He has trained in gymnastics, Brazilian jiu-jitsu and Muay Thai, plus some boxing.",
        "The combat sports he's trained in are also the ones he watches: two of his favourite athletes are Conor McGregor and Khabib Nurmagomedov.",
      ],
    },
    {
      label: "Teams and athletes",
      lines: [
        "Cricket comes first, from both of his countries; the rest are competitors at the top of rugby, combat sports, tennis and Formula 1.",
      ],
      favourites: [
        {
          label: "Favourite teams and athletes",
          items: [
            "Sri Lanka Cricket",
            "Australian men's cricket team",
            "Kumar Sangakkara",
            "Chaminda Vaas",
            "Springboks",
            "All Blacks",
            "Conor McGregor",
            'Khabib "The Eagle" Nurmagomedov',
            "Novak Djokovic",
            "Max Verstappen",
          ],
        },
      ],
    },
    {
      label: "Films and TV",
      lines: [
        "He likes good films and TV, and likes to analyse and understand the people in them: heroes, villains and ordinary people alike.",
        "Many of his favourites follow someone under pressure and what their choices cost them, and several are about faith.",
      ],
      favourites: [
        {
          label: "Favourite TV shows",
          items: [
            "Vinland Saga",
            "Andor",
            "True Detective",
            "Ted Lasso",
            "Arrow",
            "Chernobyl",
            "Daredevil",
            "Better Call Saul",
            "Slow Horses",
            "The Chosen",
          ],
        },
        {
          label: "Favourite films",
          items: [
            "Silence (2016)",
            "Spirit: Stallion of the Cimarron",
            "The Lord of the Rings: The Return of the King",
            "Interstellar",
            "Unbroken",
            "The Gentlemen",
            "How to Train Your Dragon 2",
            "Jojo Rabbit",
            "Batman Begins",
            "About Time",
          ],
        },
      ],
    },
    {
      label: "Music",
      lines: ["A mix of classic songs and themes from films and games."],
      favourites: [
        {
          label: "Favourite songs",
          items: [
            "Hey Jude",
            "Sultans of Swing",
            "Annie's Song",
            "Gratitude",
            "You Know My Name (Pop Mix Version)",
            "Nightcall",
            "On the Hunt",
            "Ezio's Family",
            'Battlefield 4 "Warsaw" theme',
          ],
        },
      ],
    },
    {
      label: "Video games",
      lines: ["The same mix as his sport: racing, competitive shooters, football and cricket."],
      favourites: [
        {
          label: "Favourite video games",
          items: [
            "Forza Motorsport 7",
            "Need for Speed: Most Wanted",
            "Battlefield 4",
            "Call of Duty: Modern Warfare 3",
            "Tom Clancy's Rainbow Six Siege",
            "Sleeping Dogs",
            "FIFA 14",
            "Cricket 24",
          ],
        },
      ],
    },
    {
      label: "Personality",
      lines: [
        "He came out as INFJ the last time he took a personality test, but he believes he's always evolving, and that personality shifts with your environment.",
        "He's adventurous and enjoys a thrill, but keeps a level head.",
      ],
    },
  ],
};
