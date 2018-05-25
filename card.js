class Card {
    constructor() {
    }
}

class Cards {
    constructor() {
        const highCards = ['jack', 'queen', 'king', 'ace'],
            cardTypes = ['diamonds', 'hearts', 'spades', 'clubs'];
    }

    getCard(match) {
        const cards = [...match.cards];

        match.players.forEach(player => cards.push(...player.cards));

        const types = [];

        cardTypes.forEach(type => {
            const cardsOfType = cards.filter(card => card.type ===
                type)
                .map(card => card.value);

            const cardType = {
                name: type,
                cards: Array.from(Array(13), (value, i) => i + 2).filter(item => !cardsOfType.includes(item))
            };

            if (cardType.cards.length)
                types.push(cardType);
        });

        const type = types[Math.floor(Math.random() * types.length)];
        const value = type.cards[Math.floor(Math.random() * type.cards.length)];

        return {
            type: type.name,
            value
        };
    }

}

class Match {
    constructor() {
        const deck = new Cards();
    }
    
}

const match = new Match();