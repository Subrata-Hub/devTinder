require("dotenv").config();
const bcrypt = require("bcrypt");
const validator = require("validator"); // Although not strictly needed for generation here, good to include for context.
const User = require("./src/models/user");
const { mongoose } = require("mongoose");

async function generateIndianUsers() {
  const users = [];

  const femaleFirstNames = [
    "Priya",
    "Rina",
    "Anjali",
    "Neha",
    "Divya",
    "Pooja",
    "Shreya",
    "Kavya",
    "Deepa",
    "Swati",
    "Meena",
    "Geeta",
    "Aisha",
    "Bhavna",
    "Chitra",
    "Disha",
    "Eshaa", // Esha -> Eshaa
    "Falguni",
    "Gauri",
    "Hema",
    "Indira",
    "Jayaa", // Jaya -> Jayaa
    "Kiran",
    "Lalita",
    "Madhuri",
    "Nisha",
    "Omara", // Oma -> Omara
    "Parul",
    "Radhika",
    "Saloni",
    "Tanvi",
    "Ushaa", // Usha -> Ushaa
    "Vidya",
    "Yamini",
    "Zoyaa", // Zoya -> Zoyaa
    "Aarohi",
    "Aditi",
    "Amara",
    "Ananya",
    "Avani",
    "Ishita",
    "Jhanvi",
    "Khushi",
    "Mitali",
    "Nandini",
    "Palak",
    "Riyaa", // Ria -> Riyaa
    "Simran",
    "Trisha",
    "Vani",
  ];

  const maleFirstNames = [
    // Your male names list (check for names < 4 chars if you encounter similar errors)
    // For example, if "Dev" causes an error, change it to "Devan" or "Devraj"
    "Amit",
    "Rahul",
    "Suresh",
    "Rajesh",
    "Vikas",
    "Gaurav",
    "Deepak",
    "Sunil",
    "Manish",
    "Alok",
    "Bharat",
    "Chandan",
    "Devan", // Changed Dev to Devan
    "Eklavya",
    "Farhan",
    "Gagan",
    "Harish",
    "Inder",
    "Jaie",
    "Kapil",
    "Lokesh",
    "Mohit",
    "Nikhil",
    "Omkar",
    "Prakash",
    "Rajat",
    "Sanjay",
    "Tarun",
    "Uday",
    "Vijay",
    "Yash",
    "Zubin",
  ];

  const lastNames = [
    "Singh",
    "Kumar",
    "Sharma",
    "Yadav",
    "Patel",
    "Reddy",
    "Gupta",
    "Das",
    "Khan",
    "Mehta",
    "Shah",
    "Jain",
    "Dubey",
    "Rao",
    "Devi",
    "Verma",
    "Malik",
    "Chopra",
    "Garg",
    "Srivastava",
    "Agarwal",
    "Mishra",
    "Pandey",
    "Thakur",
    "Naidu",
    "Chauhan",
    "Saini",
    "Pillai",
    "Nair",
    "Iyer",
    "Saha",
    "Roy",
    "Bose",
    "Ghosh",
    "Datta",
    "Chakraborty",
    "Mukherjee",
    "Dasgupta",
  ];

  // UPDATED CITIES LIST
  const cities = [
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Ahmedabad",
    "Lucknow",
  ];

  const skillsPool = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "MongoDB",
    "Express.js",
    "SQL",
    "AWS",
    "Azure",
    "GCP",
    "DevOps",
    "Data Analysis",
    "Machine Learning",
    "UI/UX Design",
    "Graphic Design",
    "Content Writing",
    "Digital Marketing",
    "SEO",
    "Sales",
    "Customer Service",
    "Project Management",
    "Financial Analysis",
    "Human Resources",
    "Networking",
    "Cybersecurity",
    "Cloud Computing",
    "Mobile App Development",
    "C++",
    "Java",
    "PHP",
    "Angular",
    "Vue.js",
    "Leadership",
    "Communication",
    "Teamwork",
    "Problem Solving",
    "Creativity",
  ];

  const hobbiesPool = [
    "Reading",
    "Traveling",
    "Cooking",
    "Photography",
    "Gardening",
    "Painting",
    "Singing",
    "Dancing",
    "Playing musical instruments",
    "Sports",
    "Gaming",
    "Hiking",
    "Yoga",
    "Meditation",
    "Writing",
    "Learning new languages",
    "Volunteering",
    "Watching movies",
    "Listening to music",
    "Collecting",
    "Coding",
    "Blogging",
    "Astronomy",
    "Birdwatching",
    "Chess",
  ];

  // UPDATED PHOTO URLS with 380x320 dimensions
  //   const photoUrls = [
  //     `https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740`, // Original default, might not be exact dimensions but a fallback
  //     `https://api.dicebear.com/8.x/lorelei/svg?seed=avatar_female_1&width=380&height=320`,
  //     `https://api.dicebear.com/8.x/lorelei/svg?seed=avatar_female_2&width=380&height=320`,
  //     `https://api.dicebear.com/8.x/lorelei/svg?seed=avatar_female_3&width=380&height=320`,
  //     `https://api.dicebear.com/8.x/lorelei/svg?seed=avatar_male_1&width=380&height=320`,
  //     `https://api.dicebear.com/8.x/lorelei/svg?seed=avatar_male_2&width=380&height=320`,
  //     `https://picsum.photos/id/1025/380/320`, // Lorem Picsum, often provides natural images.
  //     `https://picsum.photos/id/1011/380/320`,
  //     `https://picsum.photos/id/1005/380/320`,
  //     `https://picsum.photos/id/1004/380/320`,
  //     `https://picsum.photos/id/1000/380/320`,
  //     `https://i.pravatar.cc/380?img=1`, // Pravatar for random human-like avatars
  //     `https://i.pravatar.cc/380?img=2`,
  //     `https://i.pravatar.cc/380?img=3`,
  //     `https://i.pravatar.cc/380?img=4`,
  //     `https://i.pravatar.cc/380?img=5`,
  //     `https://i.pravatar.cc/380?img=6`,
  //     `https://i.pravatar.cc/380?img=7`,
  //     `https://i.pravatar.cc/380?img=8`,
  //     `https://i.pravatar.cc/380?img=9`,
  //     `https://i.pravatar.cc/380?img=10`,
  //     `https://i.pravatar.cc/380?img=11`,
  //     `https://i.pravatar.cc/380?img=12`,
  //     `https://i.pravatar.cc/380?img=13`,
  //     `https://i.pravatar.cc/380?img=14`,
  //     `https://i.pravatar.cc/380?img=15`,
  //   ];

  const photoUrls = [];

  const passwordToHash = "Subrata$1234";
  const hashedPassword = await bcrypt.hash(passwordToHash, 10); // In a real app, you would hash this once and use the hash.

  // Keep track of generated alternative emails to ensure uniqueness
  const generatedAlternativeEmails = new Set();

  for (let i = 0; i < 100; i++) {
    const isFemale = Math.random() < 0.5; // 50% female
    const firstName = isFemale
      ? femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)]
      : maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const emailId = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}@example.com`; // Ensure unique email
    const age = Math.floor(Math.random() * (40 - 18 + 1)) + 18; // Age between 18 and 40
    const gender = isFemale ? "female" : "male";
    const city =
      cities[Math.floor(Math.random() * cities.length)].toLocaleLowerCase();
    const phoneNumber = `9${Math.floor(100000000 + Math.random() * 900000000)}`; // 10-digit number starting with 9

    const photoUrl = `https://mighty.tools/mockmind-api/content/human/${i}.jpg`;

    // Generate alternative email, ensuring uniqueness and optional
    let alternativeEmail = "";
    if (Math.random() > 0.3) {
      // About 70% chance of having an alternative email
      let attempt = 0;
      do {
        alternativeEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}_alt${attempt}@example.com`;
        attempt++;
      } while (
        generatedAlternativeEmails.has(alternativeEmail) &&
        attempt < 10
      ); // Try a few times to find unique
      if (attempt < 10) {
        generatedAlternativeEmails.add(alternativeEmail);
      } else {
        alternativeEmail = undefined; // Give up if unable to find unique after attempts
      }
    } else {
      alternativeEmail = undefined; // No alternative email
    }

    // Generate a random birthday (DD/MM/YYYY) for ages 18-40 based on current year (2025)
    const currentYear = 2025;
    const birthYearMax = currentYear - 18; // Born in or before 2007
    const birthYearMin = currentYear - 40; // Born in or after 1985
    const randomBirthYear =
      Math.floor(Math.random() * (birthYearMax - birthYearMin + 1)) +
      birthYearMin;
    const randomMonth = String(Math.floor(Math.random() * 12) + 1).padStart(
      2,
      "0"
    );
    const randomDay = String(Math.floor(Math.random() * 28) + 1).padStart(
      2,
      "0"
    ); // Simplistic, avoids month-day complexities
    // const birthday = `${randomDay}/${randomMonth}/${randomBirthYear}`;
    const birthday = `${randomBirthYear}-${randomMonth}-${randomDay}`;

    // Random number of skills (1-5)
    const numSkills = Math.floor(Math.random() * 5) + 1;
    const skills = [
      ...new Set(
        Array.from({ length: numSkills }, () =>
          skillsPool[
            Math.floor(Math.random() * skillsPool.length)
          ].toLocaleLowerCase()
        )
      ),
    ];

    // Random number of hobbies (1-4)
    const numHobbies = Math.floor(Math.random() * 4) + 1;
    const hobbies = [
      ...new Set(
        Array.from({ length: numHobbies }, () =>
          hobbiesPool[
            Math.floor(Math.random() * hobbiesPool.length)
          ].toLowerCase()
        )
      ),
    ];

    users.push({
      firstName,
      lastName,
      emailId,
      password: hashedPassword, // Using plain text as requested for generation. HASH THIS IN PRODUCTION.
      age,
      gender,
      photoUrl,
      about: `Hello, I'm ${firstName}! I'm passionate about ${
        hobbies[0] || "various things"
      }.`,
      skills,
      location: city, // Using city for location as well
      city,
      phoneNumber,
      alternativeEmail, // Will be undefined if not generated
      brithday: birthday,
      hobbies,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return users;
}

// To use this:
generateIndianUsers().then((users) => {
  // console.log(users); // This will log the array of 100 user documents
  console.log(`Generated ${users.length} users.`);

  // Example of how you would insert them using Mongoose (assuming you have a User model):

  //   const User = require("./path/to/your/userModel"); // Your Mongoose User model

  mongoose
    .connect(process.env.DB_HOST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      console.log("MongoDB connected successfully.");
      try {
        // Delete existing users if you want to fresh insert
        // await User.deleteMany({});
        // console.log('Existing users deleted.');

        await User.insertMany(users);
        console.log("100 users inserted successfully!");
      } catch (error) {
        console.error("Error inserting users:", error);
      } finally {
        mongoose.disconnect();
      }
    })
    .catch((err) => console.error("MongoDB connection error:", err));
});
