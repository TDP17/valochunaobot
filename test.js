const { db } = require("./database/initDB");

const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

(async () => {
  // await db.connect();
  // dbExemptedUsers = db.db("main").collection("exemptedUsers");
  // const exemptedList = await dbExemptedUsers
  //   .find({}, { projection: { _id: 0 } })
  //   .toArray();

  const signupsList = [
    { username: "a", rank: 2 },
    { username: "b", rank: 12 },
    { username: "c", rank: 6 },
    { username: "d", rank: 1 },
  ];

  // const nonExemptedList = signupsList.filter(
  //   (u) => !exemptedList.find((e) => e.username === u.username)
  // );

  // const popped = nonExemptedList.pop();

  // const finalList = nonExemptedList.map((u) => {
  //   return { username: u.username };
  // });
  // console.log(finalList.concat(exemptedList));

  // await db.close();
  // const a = { one: 0, two: 0, three: 0, four: 0 };
  // const b = { one: 0, two: 0, three: 0, four: 0 };
  // const c = { one: 0, two: 0, three: 0, four: 0 };
  // const d = { one: 0, two: 0, three: 0, four: 0 };

  // for (let i = 0; i < 1000000; i++) {
  //   shuffleArray(signupsList);
  //   if (signupsList[0].username == "a") {
  //     a.one++;
  //   }
  //   if (signupsList[0].username == "b") {
  //     b.one++;
  //   }
  //   if (signupsList[0].username == "c") {
  //     c.one++;
  //   }
  //   if (signupsList[0].username == "d") {
  //     d.one++;
  //   }

  //   if (signupsList[1].username == "a") {
  //     a.two++;
  //   }
  //   if (signupsList[1].username == "b") {
  //     b.two++;
  //   }
  //   if (signupsList[1].username == "c") {
  //     c.two++;
  //   }
  //   if (signupsList[1].username == "d") {
  //     d.two++;
  //   }

  //   if (signupsList[2].username == "a") {
  //     a.three++;
  //   }
  //   if (signupsList[2].username == "b") {
  //     b.three++;
  //   }
  //   if (signupsList[2].username == "c") {
  //     c.three++;
  //   }
  //   if (signupsList[2].username == "d") {
  //     d.three++;
  //   }

  //   if (signupsList[3].username == "a") {
  //     a.four++;
  //   }
  //   if (signupsList[3].username == "b") {
  //     b.four++;
  //   }
  //   if (signupsList[3].username == "c") {
  //     c.four++;
  //   }
  //   if (signupsList[3].username == "d") {
  //     d.four++;
  //   }
  // }

  // console.log(a);
  // console.log(b);
  // console.log(c);
  // console.log(d);
})();
