// Franchises and their characters for the "Games" and "TV & Movies" modes.
// `medium` is where the franchise started: game, tv or movie. It decides which mode a franchise appears in, and its card icon.
// Every character name must be unique across ALL franchises (tools/selftest.mjs checks this),
// so a card never fits two sets in the same deal.
// Names of characters and franchises are trademarks of their owners; they are used here only as trivia.
(function () {
  const S = (globalThis.Sol = globalThis.Sol || {});

  S.FANDOM = [
    // ---- Video games ----
    { name: 'Super Mario', medium: 'game', chars: ['Mario', 'Luigi', 'Princess Peach', 'Bowser', 'Toad', 'Yoshi', 'Wario', 'Rosalina'] },
    { name: 'Legend of Zelda', medium: 'game', chars: ['Link', 'Princess Zelda', 'Ganondorf', 'Impa', 'Navi', 'Epona', 'Midna', 'Tingle'] },
    { name: 'Pokémon', medium: 'game', chars: ['Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle', 'Jigglypuff', 'Mewtwo', 'Eevee', 'Snorlax'] },
    { name: 'Sonic', medium: 'game', chars: ['Sonic', 'Tails', 'Knuckles', 'Amy Rose', 'Dr. Eggman', 'Shadow', 'Rouge', 'Big the Cat'] },
    { name: 'Street Fighter', medium: 'game', chars: ['Ryu', 'Ken', 'Chun-Li', 'Guile', 'Blanka', 'Zangief', 'Dhalsim', 'Cammy'] },
    { name: 'Final Fantasy VII', medium: 'game', chars: ['Cloud Strife', 'Tifa', 'Aerith', 'Barret', 'Sephiroth', 'Yuffie', 'Red XIII', 'Vincent'] },
    { name: 'Halo', medium: 'game', chars: ['Master Chief', 'Cortana', 'The Arbiter', 'Sgt. Johnson', 'Captain Keyes', 'Guilty Spark', 'Dr. Halsey', 'Gravemind'] },
    { name: 'The Witcher', medium: 'game', chars: ['Geralt', 'Yennefer', 'Ciri', 'Triss', 'Dandelion', 'Vesemir', 'Zoltan', 'Eredin'] },
    { name: 'Overwatch', medium: 'game', chars: ['Tracer', 'Mercy', 'Reinhardt', 'Genji', 'Hanzo', 'D.Va', 'Winston', 'Widowmaker'] },
    { name: 'Metal Gear Solid', medium: 'game', chars: ['Solid Snake', 'Otacon', 'Revolver Ocelot', 'Big Boss', 'Meryl', 'Liquid Snake', 'Raiden', 'Psycho Mantis'] },
    { name: 'Resident Evil', medium: 'game', chars: ['Leon Kennedy', 'Jill Valentine', 'Chris Redfield', 'Claire Redfield', 'Albert Wesker', 'Ada Wong', 'Nemesis', 'Lady Dimitrescu'] },
    { name: 'Mortal Kombat', medium: 'game', chars: ['Scorpion', 'Sub-Zero', 'Liu Kang', 'Sonya Blade', 'Johnny Cage', 'Kitana', 'Shao Kahn', 'Goro'] },
    { name: 'The Last of Us', medium: 'game', chars: ['Joel', 'Ellie', 'Tess', 'Abby', 'Tommy', 'Dina', 'Marlene', 'Bill'] },
    { name: 'God of War', medium: 'game', chars: ['Kratos', 'Atreus', 'Freya', 'Baldur', 'Mimir', 'Brok', 'Sindri', 'Faye'] },
    { name: 'Animal Crossing', medium: 'game', chars: ['Tom Nook', 'Isabelle', 'K.K. Slider', 'Blathers', 'Celeste', 'Mabel', "Kapp'n", 'Redd'] },
    { name: 'League of Legends', medium: 'game', chars: ['Ahri', 'Jinx', 'Teemo', 'Yasuo', 'Lux', 'Garen', 'Thresh', 'Ezreal'] },
    { name: 'Mass Effect', medium: 'game', chars: ['Commander Shepard', 'Garrus', 'Liara', "Tali'Zorah", 'Wrex', 'Mordin', 'Saren', 'Miranda'] },

    // ---- TV shows ----
    { name: 'The Simpsons', medium: 'tv', chars: ['Homer', 'Marge', 'Bart', 'Lisa', 'Maggie', 'Mr. Burns', 'Ned Flanders', 'Krusty'] },
    { name: 'Friends', medium: 'tv', chars: ['Rachel', 'Ross', 'Monica', 'Chandler', 'Joey', 'Phoebe', 'Gunther', 'Janice'] },
    { name: 'Breaking Bad', medium: 'tv', chars: ['Walter White', 'Jesse Pinkman', 'Skyler White', 'Hank Schrader', 'Saul Goodman', 'Gus Fring', 'Mike Ehrmantraut', 'Todd Alquist'] },
    { name: 'Game of Thrones', medium: 'tv', chars: ['Jon Snow', 'Daenerys', 'Tyrion', 'Arya Stark', 'Cersei', 'Jaime Lannister', 'Sansa Stark', 'Hodor'] },
    { name: 'Stranger Things', medium: 'tv', chars: ['Eleven', 'Mike Wheeler', 'Dustin', 'Lucas Sinclair', 'Will Byers', 'Jim Hopper', 'Max Mayfield', 'Vecna'] },
    { name: 'The Office', medium: 'tv', chars: ['Michael Scott', 'Dwight Schrute', 'Jim Halpert', 'Pam Beesly', 'Kevin Malone', 'Angela Martin', 'Creed Bratton', 'Stanley Hudson'] },
    { name: 'SpongeBob', medium: 'tv', chars: ['SpongeBob', 'Patrick Star', 'Squidward', 'Mr. Krabs', 'Sandy Cheeks', 'Plankton', 'Gary', 'Mrs. Puff'] },
    { name: 'Big Bang Theory', medium: 'tv', chars: ['Sheldon', 'Leonard', 'Penny', 'Howard', 'Raj', 'Amy Farrah Fowler', 'Bernadette', 'Stuart'] },
    { name: 'Rick and Morty', medium: 'tv', chars: ['Rick Sanchez', 'Morty Smith', 'Summer Smith', 'Beth Smith', 'Jerry Smith', 'Birdperson', 'Mr. Meeseeks', 'Squanchy'] },
    { name: 'The Last Airbender', medium: 'tv', chars: ['Aang', 'Katara', 'Sokka', 'Zuko', 'Toph', 'Uncle Iroh', 'Azula', 'Appa'] },
    { name: 'Naruto', medium: 'tv', chars: ['Naruto', 'Sasuke', 'Sakura', 'Kakashi', 'Itachi', 'Hinata', 'Gaara', 'Jiraiya'] },
    { name: 'Dragon Ball', medium: 'tv', chars: ['Goku', 'Vegeta', 'Piccolo', 'Gohan', 'Krillin', 'Frieza', 'Bulma', 'Trunks'] },
    { name: 'One Piece', medium: 'tv', chars: ['Luffy', 'Zoro', 'Nami', 'Sanji', 'Usopp', 'Chopper', 'Nico Robin', 'Shanks'] },
    { name: 'Brooklyn Nine-Nine', medium: 'tv', chars: ['Jake Peralta', 'Amy Santiago', 'Rosa Diaz', 'Captain Holt', 'Terry Jeffords', 'Charles Boyle', 'Gina Linetti', 'Hitchcock'] },

    // ---- Movies ----
    { name: 'Star Wars', medium: 'movie', chars: ['Luke Skywalker', 'Darth Vader', 'Princess Leia', 'Han Solo', 'Yoda', 'Chewbacca', 'Obi-Wan Kenobi', 'R2-D2'] },
    { name: 'Harry Potter', medium: 'movie', chars: ['Harry Potter', 'Hermione', 'Ron Weasley', 'Dumbledore', 'Severus Snape', 'Voldemort', 'Hagrid', 'Draco Malfoy'] },
    { name: 'Lord of the Rings', medium: 'movie', chars: ['Frodo', 'Gandalf', 'Aragorn', 'Legolas', 'Gimli', 'Samwise', 'Gollum', 'Sauron'] },
    { name: 'The Avengers', medium: 'movie', chars: ['Iron Man', 'Captain America', 'Thor', 'Hulk', 'Black Widow', 'Hawkeye', 'Thanos', 'Loki'] },
    { name: 'Toy Story', medium: 'movie', chars: ['Woody', 'Buzz Lightyear', 'Jessie', 'Rex', 'Hamm', 'Slinky Dog', 'Mr. Potato Head', 'Bo Peep'] },
    { name: 'Shrek', medium: 'movie', chars: ['Shrek', 'Donkey', 'Princess Fiona', 'Puss in Boots', 'Lord Farquaad', 'Gingy', 'Prince Charming', 'Fairy Godmother'] },
    { name: 'Frozen', medium: 'movie', chars: ['Elsa', 'Anna', 'Olaf', 'Kristoff', 'Sven', 'Prince Hans', 'Oaken', 'Grand Pabbie'] },
    { name: 'The Matrix', medium: 'movie', chars: ['Neo', 'Trinity', 'Morpheus', 'Agent Smith', 'The Oracle', 'Cypher', 'Niobe', 'The Architect'] },
    { name: 'Back to the Future', medium: 'movie', chars: ['Marty McFly', 'Doc Brown', 'Biff Tannen', 'Lorraine Baines', 'George McFly', 'Jennifer Parker', 'Mr. Strickland', 'Clara Clayton'] },
    { name: 'Pirates of the Caribbean', medium: 'movie', chars: ['Jack Sparrow', 'Will Turner', 'Elizabeth Swann', 'Barbossa', 'Davy Jones', 'Tia Dalma', 'Joshamee Gibbs', 'Cutler Beckett'] },
    { name: 'The Lion King', medium: 'movie', chars: ['Simba', 'Mufasa', 'Scar', 'Nala', 'Timon', 'Pumbaa', 'Rafiki', 'Zazu'] },
    { name: 'Batman', medium: 'movie', chars: ['Batman', 'The Joker', 'Alfred', 'Catwoman', 'Bane', 'Harley Quinn', 'Gordon', 'The Riddler'] },
    { name: 'Ghostbusters', medium: 'movie', chars: ['Peter Venkman', 'Ray Stantz', 'Egon Spengler', 'Winston Zeddemore', 'Slimer', 'Dana Barrett', 'Louis Tully', 'Stay Puft'] },
    { name: 'Indiana Jones', medium: 'movie', chars: ['Indiana Jones', 'Marion Ravenwood', 'Short Round', 'Sallah', 'Belloq', 'Henry Jones Sr.', 'Willie Scott', 'Mutt Williams'] },
    { name: 'Despicable Me', medium: 'movie', chars: ['Gru', 'Agnes', 'Margo', 'Edith', 'Dr. Nefario', 'Vector', 'Lucy Wilde', 'Balthazar Bratt'] },
    { name: 'Finding Nemo', medium: 'movie', chars: ['Nemo', 'Marlin', 'Dory', 'Crush', 'Bruce', 'Gill', 'Squirt', 'Mr. Ray'] },
  ];
})();
