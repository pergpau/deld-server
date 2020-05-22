DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO delno_db;
COMMENT ON SCHEMA public IS 'standard public schema';

CREATE TYPE item_type_e AS ENUM ('thing', 'book', 'skill');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
	username VARCHAR (50) UNIQUE NOT NULL,
    first_name VARCHAR (100) NOT NULL,
    last_name VARCHAR (100) NOT NULL,
	email VARCHAR (355) UNIQUE NOT NULL,
    phone VARCHAR (20) UNIQUE NOT NULL,
    circles INTEGER DEFAULT 1,
	password_hash VARCHAR (200) NOT NULL,
	avatar_url VARCHAR (200),
    validated_email BOOLEAN DEFAULT false,
    validation_hash VARCHAR(40),
    validated_phone BOOLEAN DEFAULT false,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_login TIMESTAMP
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
	parent_id INTEGER REFERENCES categories(category_id),
    category_title VARCHAR (100) NOT NULL
);

CREATE TABLE items (
    item_id SERIAL PRIMARY KEY,
    item_type item_type_e,
	owner INTEGER NOT NULL REFERENCES users(user_id),
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    title VARCHAR (100) NOT NULL,
	description TEXT,
    author VARCHAR (100) DEFAULT NULL,
    rating DOUBLE PRECISION DEFAULT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans (
    loan_id SERIAL PRIMARY KEY,
	item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
	loaned_to INTEGER REFERENCES users(user_id),
	last_loaned_date DATE,
    pending BOOLEAN NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE trust (
    trust_id SERIAL PRIMARY KEY,
	truster_id INTEGER NOT NULL REFERENCES users(user_id),
    trusted_id INTEGER NOT NULL REFERENCES users(user_id)
);

		
INSERT INTO users(username,first_name,last_name,email,phone,circles,password_hash, validated_email) 
VALUES
('pergpau','Per Gunnar','Paulsen','test@test.no', '3412421', 2, '$2b$10$Owl1M4iINoy4S5Xh3F91keQymfe5ZxzE07IYo6Qi19XkMWHtg2d1e', true),
('heikemo','Harald','Eikemo','heikemo@test.no', '123456789', 1,'$2b$10$Owl1M4iINoy4S5Xh3F91keQymfe5ZxzE07IYo6Qi19XkMWHtg2d1e', true),
('rolfsen','Rolf','Sekkepipe','rolfsen@online.no', '7521514659', 3,'$2b$10$Owl1M4iINoy4S5Xh3F91keQymfe5ZxzE07IYo6Qi19XkMWHtg2d1e', true),
('akjeksen','Alexander','Teinum','teinum@gmail.com', '98765442414165231', 3,'$2b$10$Owl1M4iINoy4S5Xh3F91keQymfe5ZxzE07IYo6Qi19XkMWHtg2d1e', true),
('terjefs','Terje','Palm','palmen@yahoo.com', '52352323421', 2,'$2b$10$Owl1M4iINoy4S5Xh3F91keQymfe5ZxzE07IYo6Qi19XkMWHtg2d1e', true),
('kanakomp','Kanako','Mizushima','mizu@shima.jp', '+811241242121514659', 1,'$2b$10$Owl1M4iINoy4S5Xh3F91keQymfe5ZxzE07IYo6Qi19XkMWHtg2d1e', true),
('petterm','Petter','Mehlum','petter@ifi.no', '+47213221514659', 2,'$2b$10$Owl1M4iINoy4S5Xh3F91keQymfe5ZxzE07IYo6Qi19XkMWHtg2d1e', true),
('kongen','Sonja','Rex','sjefen@slottet.no', '322259', 2,'$2b$10$Owl1M4iINoy4S5Xh3F91keQymfe5ZxzE07IYo6Qi19XkMWHtg2d1e', true)
;

UPDATE users
SET avatar_url = CONCAT('https://randomuser.me/api/portraits/men/', users.user_id ,'.jpg')
;

INSERT INTO trust(truster_id, trusted_id)
VALUES
(1, 2),
(1,	3),
(2,	1),
(2, 5),
(2, 6),
(3, 1),
(3, 4),
(4, 3),
(4, 8),
(5, 2),
(6, 5),
(6, 7),
(7, 8),
(8, 7)
;

INSERT INTO categories(category_id, parent_id, category_title)
VALUES
(1, NULL, 'Ting'),
(4, 1, 'Verktøy'),
(5,	1, 'Friluftsliv'),
(6,	1, 'Elektronikk'),
(2, NULL, 'Bøker'),
(7,	2, 'Skjønnlitteratur'),
(8,	2, 'Faglitteratur'),
(9, 2, 'Lyrikk'),
(3, NULL, 'Kunnskap'),
(10,	3, 'Teknologi'),
(11, 3,	'Kampsport'),
(12, 3,	'Praktisk')
;


INSERT INTO items (item_type, owner, category_id, title, description, author, rating)
VALUES
('thing', 5, 4, 'Bosch stikksag', 'Helt ny og fin stikksag fra Bosch. Ekstra blad følger med', NULL, NULL),
('thing', 3, 5, 'Firemannstelt', 'Perfekt for ekstremturer med familien.', NULL, NULL),
('thing', 2, 5, 'Sovepose ekstrem', 'Sovepose som tåler minus 20.', NULL, NULL),
('thing', 1, 5, 'Lett sovepose', 'Fin for teltur om sommeren', NULL, NULL),
('thing', 2, 5, 'Teppepose', 'Passer bra for gjester, og ikke så bra for turer når det er kaldt.', NULL, NULL),
('thing', 3, 4, 'Bærepose', 'Fin å ha i butikken', NULL, NULL),
('thing', 1, 4, 'Drill fra Biltema', 'Skrur som bare f', NULL, NULL),
('thing', 3, 5, 'Sekk', 'Flott til lange turer. Et godt stykke borte fra stua hans lå kongsgården, og like utenfor vinduene til kongen hadde det vokset opp en eik, som var så stor og diger at den skygget for lyset i kongsgården; kongen hadde lovt ut mange, mange penger til den som kunne hugge ned eika; men ingen var god for det, for så fort en skåret en flis av eikeleggen, vokste det to', NULL, NULL),
('thing', 3, 5, 'Tursekk', 'Sekken du trenger for fjelltur', NULL, NULL),
('book', 3, 7, 'Island', 'Spennende bok av Huxley', 'Aldous Huxley', 4.5),
('book', 3, 8, 'På vei', 'Nøkkelen til det norske språk.', 'Elisabeth Ellingsen', 5),
('skill', 3, 11, 'Karate', 'Har drevet aktivt med karate i 15 år', NULL, NULL),
('skill', 3, 10, 'Programmering', 'Kan spesielt mye om web-programmering', NULL, NULL),
('skill', 3, 12, 'Oppussing', 'Begynner å få en del erfaring med all slags oppussing. Spør meg hvis du lurer på noe.', NULL, NULL),
('skill', 1, 11, 'Kendo', 'Er med i Oslo Kendoklub. 5 års erfaring. Spør hvis du er interessert i kendo! :)', NULL, NULL)
;

INSERT INTO loans(item_id, loaned_to, last_loaned_date, pending)
VALUES 
(3, 8, CURRENT_DATE, false),
(6, 1, CURRENT_DATE, false),
(7, 3, CURRENT_DATE, false),
(9, 2, CURRENT_DATE, false),
(11, 1, CURRENT_DATE, false)
;


