import { SalesRep } from '../types';

const territories = [
  'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 
  'Northwest', 'Mid-Atlantic', 'Mountain West', 'New England', 'Southern California'
];

// Exactly 100 fixed names for the sales team
const repNames = [
  "James Anderson", "Olivia Smith", "Robert Brown", "Emily Davis", "William Johnson", // 1-5
  "Sophia Wilson", "David Taylor", "Isabella Moore", "Richard Miller", "Mia Anderson", // 6-10
  "Joseph White", "Charlotte Harris", "Thomas Martin", "Amelia Thompson", "Christopher Garcia", // 11-15
  "Evelyn Martinez", "Charles Robinson", "Abigail Clark", "Daniel Rodriguez", "Harper Lewis", // 16-20
  "Matthew Lee", "Emily Walker", "Anthony Hall", "Elizabeth Allen", "Mark Young", // 21-25
  "Sofia King", "Donald Wright", "Avery Scott", "Steven Green", "Scarlett Baker", // 26-30
  "Paul Adams", "Madison Nelson", "Andrew Hill", "Luna Campbell", "Kenneth Mitchell", // 31-35
  "Grace Carter", "Kevin Roberts", "Chloe Gomez", "Brian Phillips", "Victoria Evans", // 36-40
  "Edward Turner", "Riley Diaz", "Ronald Parker", "Aria Cruz", "Timothy Edwards", // 41-45
  "Layla Collins", "Jason Stewart", "Zoey Morris", "Jeffrey Rogers", "Michael Thompson", // 46-50 (Michael is Rank 50)
  "Nora Murphy", "Ryan Cook", "Hazel Rogers", "Gary Morgan", "Aurora Bell", // 51-55
  "Jacob Reed", "Savannah Cooper", "Larry Bailey", "Audrey Richardson", "Frank Cox", // 56-60
  "Brooklyn Howard", "Scott Ward", "Bella Torres", "Justin Peterson", "Claire Gray", // 61-65
  "Brandon James", "Skylar Watson", "Raymond Brooks", "Lucy Kelly", "Gregory Sanders", // 66-70
  "Paisa Price", "Samuel Bennett", "Nova Wood", "Benjamin Barnes", "Elena Ross", // 71-75
  "Patrick Henderson", "Emilia Coleman", "Jack Jenkins", "Violet Perry", "Dennis Powell", // 76-80
  "Willow Long", "Jerry Patterson", "Alice Hughes", "Tyler Flores", "Cora Washington", // 81-85
  "Alexander Butler", "Ivy Simmons", "Henry Foster", "Lydia Gonzales", "Douglas Bryant", // 86-90
  "Adeline Alexander", "Peter Russell", "Delilah Griffin", "Walter Hayes", "Vivian Myers", // 91-95
  "Harold Ford", "Madeline Hamilton", "Kyle Graham", "Raquel Sullivan", "Arthur Wallace" // 96-100
];

const getGender = (firstName: string) => {
  const femaleNames = new Set([
    'Olivia', 'Emily', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Evelyn', 'Abigail', 'Harper',
    'Elizabeth', 'Sofia', 'Avery', 'Scarlett', 'Madison', 'Luna', 'Grace', 'Chloe', 'Victoria', 'Riley',
    'Aria', 'Layla', 'Zoey', 'Nora', 'Hazel', 'Aurora', 'Savannah', 'Audrey', 'Brooklyn', 'Bella',
    'Claire', 'Skylar', 'Lucy', 'Paisa', 'Nova', 'Elena', 'Emilia', 'Violet', 'Willow', 'Alice',
    'Cora', 'Ivy', 'Lydia', 'Adeline', 'Delilah', 'Vivian', 'Madeline', 'Raquel'
  ]);
  return femaleNames.has(firstName) ? 'women' : 'men';
};

export const woltersKluwerReps: SalesRep[] = repNames.map((fullName, index) => {
  const [firstName, lastName] = fullName.split(' ');
  const rank = index + 1;
  const gender = getGender(firstName);

  // Static annual quota based on index
  const annualQuota = 350000 + (index * 1250);

  return {
    id: `rep${String(rank).padStart(3, '0')}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@wolterskluwer.com`,
    role: 'Sales Rep',
    profilePicUrl: `https://randomuser.me/api/portraits/${gender}/${index + 1}.jpg`,
    territory: territories[index % territories.length],
    quota: annualQuota,
  };
});
