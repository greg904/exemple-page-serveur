var http = require("http");

var serveur = http.createServer(function(requete, reponse) {
    console.log("Adresse du client", requete.socket.remoteAddress);
    console.log("Méthode :", requete.method);
    console.log("URL :", requete.url);
    console.log("Entêtes :", requete.headers);

    // À ce moment là, le serveur à bien reçu l'URL et les entêtes mais pas
    // forcément le corps de la requête. Encore une fois, c'est fait pour
    // pouvoir faire des choses pendant que l'entièreté de la requête est recue.

    // Là il y a un truc un peu chiant à comprendre. En fait les navigateurs se
    // sont rendus compte qu'il y avait un problème avec "fetch", c'est qu'on
    // pouvait se faire passer pour l'utilisateur sur des autres sites et faire
    // des actions à sa place. Imagine que je fais une page qui lance un "fetch"
    // avec l'URL de ta banque pour m'envoyer de l'argent... Lorsque "fetch" a
    // été introduit, les navigateurs voulaient que les sites existants
    // continuent à être sécurisés donc ce qu'ils ont fait c'est que lorsqu'on
    // utilise "fetch" sur une page dont l'origine (le nom de domaine en gros)
    // est différente que l'origine de la requête (dans notre cas, l'origine de
    // la page est file:// et l'origine de la requête est
    // http://localhost:8080), avant d'envoyer une requête le navigateur envoie
    // une fausse prérequête dont la méthode n'est ni GET, ni POST mais est
    // OPTIONS et si le serveur ne répond pas avec une entête spécifique qui dit
    // qu'il autorise l'origine de la page, alors le navigateur annule la
    // requête et renvoie une erreur. Ca s'appelle CORS (Cross-Origin Request
    // Sharing). Il faut donc faire ça ici.
    if (requete.method === "OPTIONS") {
        reponse.writeHead(200, {
            // On autorise toutes les origines (pas forcément une bonne idée !).
            "Access-Control-Allow-Origin": "*",

            // On autorise ces entêtes. Les entêtes de base sont déjà autorisées
            // mais on rajoute notre propre entête. Encore une fois, normalement
            // on a presque jamais besoin de toucher aux entêtes donc on a pas
            // besoin de cette ligne.
            "Access-Control-Allow-Headers": "MonEnteteRequete",
        });
        // Pas besoin de corps.
        reponse.end();
        return;
    }
    
    var boutsDeCorps = [];

    requete.on("data", function(boutDeCorps) {
        // On a recu un nouveau bout.
        boutsDeCorps.push(boutDeCorps);
    });

    requete.on("end", function() {
        // C'est bon, on a reçu tout le corps. On concatène tout les bouts que
        // l'on a reçu.
        var corps = Buffer.concat(boutsDeCorps);

        // "corps" est un objet de type "Buffer". On le convertit en chaîne de
        // caractère en l'interprétant avec l'encodage UTF-8 (c'est ce que le
        // navigateur envoie lorsqu'on envoie une chaine de caractère).
        var corpsChaineDeCaractere = corps.toString("utf-8");

        console.log("Corps :", corpsChaineDeCaractere);

        // Tout s'est bien passé, on répond avec un code 200 qui veut dire OK.
        reponse.writeHead(200, {
            // Encore une fois, il faut assuer au navigateur que l'origine de la
            // page a le droit de lire la réponse de la seconde, vrai requête.
            "Access-Control-Allow-Origin": "*",

            // J'ajoute un entête bidon pour montrer comment ça marche.
            MonEnteteReponse: "bonjour client",

            // On assure au navigateur que l'entête est safe à lire du côté
            // client.
            "Access-Control-Expose-Headers": "MonEnteteReponse",
        });

        // Puis on écrit le corps de la réponse.
        reponse.write("J'ai bien reçu " + corpsChaineDeCaractere);

        // On marque la fin de la réponse.
        reponse.end();
    });

    requete.on("error", function(erreur) {
        console.log("Erreur :", erreur);
    });
});

// Commence à écouter sur le port 8080.
serveur.listen(8080);
