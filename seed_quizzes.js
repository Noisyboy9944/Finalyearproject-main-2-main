const quizzes = [
  {
    program_id: "5a8e0f6b-7b0b-4b1a-9f5e-1b2c3d4e5f6a", // Graphic Designing
    questions: [
      {
        question: "In brand identity design, what does 'White Space' help achieve?",
        options: ["Makes the design smaller", "Reduces printing costs", "Provides visual breathing room and focus", "Allows for more text"],
        correct_option_index: 2
      },
      {
        question: "Which color model is primarily used for print design?",
        options: ["RGB", "CMYK", "HSL", "HEX"],
        correct_option_index: 1
      },
      {
        question: "What is the primary difference between 'Kerning' and 'Leading'?",
        options: ["Kerning is vertical, Leading is horizontal", "Kerning is between characters, Leading is between lines", "They are the same", "One is for images, one for text"],
        correct_option_index: 1
      },
      {
        question: "A logo that looks the same on both sides is an example of which design principle?",
        options: ["Contrast", "Hierarchy", "Symmetry/Balance", "Repetition"],
        correct_option_index: 2
      }
    ]
  },
  {
    program_id: "8b605dee-0056-441c-a989-b79cc8517aec", // C Programming
    questions: [
      {
        question: "Which of the following is the correct way to declare a pointer in C?",
        options: ["int p;", "int &p;", "int *p;", "pointer int p;"],
        correct_option_index: 2
      },
      {
        question: "What is the result of '5 % 2' in C programming?",
        options: ["2.5", "2", "1", "0"],
        correct_option_index: 2
      },
      {
        question: "Which header file is required for using the 'printf' function?",
        options: ["conio.h", "math.h", "stdlib.h", "stdio.h"],
        correct_option_index: 3
      },
      {
        question: "Every C program must have exactly one ______ function to start execution.",
        options: ["start()", "main()", "begin()", "init()"],
        correct_option_index: 1
      }
    ]
  },
  {
    program_id: "5bfc208f-08ef-44e0-aea9-38548de0b2fc", // Digital Marketing
    questions: [
      {
        question: "What does SEO stand for in Digital Marketing?",
        options: ["Social Engine Optimization", "Search Engine Optimization", "Sales Enablement Office", "Secure Electronic Online"],
        correct_option_index: 1
      },
      {
        question: "Which of these is a form of 'Paid Search' advertising?",
        options: ["Organic Search", "Blogging", "PPC (Pay-Per-Click)", "Email Newsletters"],
        correct_option_index: 2
      },
      {
        question: "The 'Marketing Funnel' stage where a customer discovers a brand is called:",
        options: ["Conversion", "Loyalty", "Awareness", "Consideration"],
        correct_option_index: 2
      },
      {
        question: "Which metric measures the percentage of people who click a link after seeing an ad?",
        options: ["ROI", "CTR (Click-Through Rate)", "CPC", "CPM"],
        correct_option_index: 1
      }
    ]
  },
  {
    program_id: "5ccd9fb7-426b-4e1d-bcce-5aee4ce14c81", // UI/UX
    questions: [
      {
        question: "Which of these best describes 'User Experience' (UX)?",
        options: ["The visual buttons and colors", "The internal logical feel and usability of a product", "The marketing logo", "The server speed"],
        correct_option_index: 1
      },
      {
        question: "What is the primary purpose of a 'Wireframe'?",
        options: ["To show final colors", "To test the production code", "To outline the basic structure and layout", "To create a high-fidelity prototype"],
        correct_option_index: 2
      },
      {
        question: "In design, 'Accessibility' refers to:",
        options: ["How fast the site loads", "Making the product usable for everyone, including people with disabilities", "Allowing users to access the source code", "Lowering the subscription price"],
        correct_option_index: 1
      },
      {
        question: "Which phase of the Design Thinking process involves observing users?",
        options: ["Empathize", "Define", "Ideate", "Prototype"],
        correct_option_index: 0
      }
    ]
  },
  {
    program_id: "02cff3de-f2b8-43ac-b765-9469724a280d", // Python
    questions: [
      {
        question: "How do you define a function in Python?",
        options: ["function myFunc():", "def myFunc():", "func myFunc():", "define myFunc():"],
        correct_option_index: 1
      },
      {
        question: "Which of the following is used to handle exceptions in Python?",
        options: ["try...except", "do...while", "catch...throw", "if...else"],
        correct_option_index: 0
      },
      {
        question: "What is the correct syntax to create a list in Python?",
        options: ["(1, 2, 3)", "{1, 2, 3}", "[1, 2, 3]", "list<1, 2, 3>"],
        correct_option_index: 2
      },
      {
        question: "Python uses ______ to define blocks of code instead of curly braces.",
        options: ["Semicolons", "Parentheses", "Indentation", "Keywords"],
        correct_option_index: 2
      }
    ]
  },
  {
    program_id: "3b49eadb-6746-4ed9-9c2f-82c155a0041d", // MYSQL
    questions: [
      {
        question: "Which SQL command is used to retrieve data from a database?",
        options: ["GET", "OPEN", "FETCH", "SELECT"],
        correct_option_index: 3
      },
      {
        question: "What does the 'WHERE' clause do in a SELECT statement?",
        options: ["Sorts the data", "Filters records based on a condition", "Deletes the table", "Joins two tables"],
        correct_option_index: 1
      },
      {
        question: "A unique identifier for each record in a table is called a:",
        options: ["Foreign Key", "Primary Key", "Index Key", "Master Key"],
        correct_option_index: 1
      },
      {
        question: "Which command removes all records from a table without deleting the table structure?",
        options: ["DELETE", "DROP", "TRUNCATE", "REMOVE"],
        correct_option_index: 2
      }
    ]
  },
  {
    program_id: "5cc69c85-3e1f-4404-87fd-77d114cfbb7d", // DSA
    questions: [
      {
        question: "Which data structure follows the LIFO (Last-In-First-Out) principle?",
        options: ["Queue", "Linked List", "Stack", "Array"],
        correct_option_index: 2
      },
      {
        question: "What is the time complexity of searching for an element in a Hash Map (average case)?",
        options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"],
        correct_option_index: 2
      },
      {
        question: "Which algorithm is a 'Divide and Conquer' sorting algorithm?",
        options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
        correct_option_index: 2
      },
      {
        question: "In a Linked List, each node contains data and a ______ to the next node.",
        options: ["Index", "Reference/Pointer", "Array", "String"],
        correct_option_index: 1
      }
    ]
  },
  {
    program_id: "6f86fbb0-6802-475f-9120-f75057eec305", // Cloud Computing
    questions: [
      {
        question: "What does SaaS stand for?",
        options: ["Server as a Service", "Software as a Service", "System as a Service", "Security as a Service"],
        correct_option_index: 1
      },
      {
        question: "Which cloud service provides a virtual machine instance (like EC2)?",
        options: ["IaaS", "PaaS", "SaaS", "Serverless"],
        correct_option_index: 0
      },
      {
        question: "In AWS, an 'S3 Bucket' is primarily used for:",
        options: ["Running code", "Managing databases", "Object storage", "Networking"],
        correct_option_index: 2
      },
      {
        question: "What is 'Cloud Elasticity'?",
        options: ["The ability to change colors", "Automatically scaling resources up or down based on demand", "Securing a network with a firewall", "The physical wires in a data center"],
        correct_option_index: 1
      }
    ]
  }
];

db.quizzes.deleteMany({});
db.quizzes.insertMany(quizzes);
console.log("Successfully seeded course-relevant quizzes for 8 programs.");
