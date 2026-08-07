-- Troca o tour virtual da Casa do Vale por um espaço público da Matterport
-- (rode se a seção "Tour virtual" aparecer em branco na página do imóvel)
UPDATE "PropertyMedia"
SET url = 'https://my.matterport.com/show/?m=SxQL3iGyoDo'
WHERE id = 'dm_m4';
