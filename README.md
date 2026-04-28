# Matrix Rotation Using Array Logic in C

The Matrix Rotation Using Array Logic is a logic-oriented mini project developed in the C programming language to demonstrate the manipulation and transformation of two-dimensional arrays through index-based operations. The project focuses on rotating a user-defined matrix by 90 degrees clockwise using nested loop processing and temporary array mapping.

In this application, the user enters the number of rows, columns, and matrix elements. The program first displays the original matrix and then applies an array rotation algorithm to generate a new matrix with rotated positions. This process is achieved by carefully changing the row and column indexes of each element according to matrix rotation logic.

The project is highly useful for understanding advanced array handling, nested loop traversal, memory indexing, and matrix transformation techniques. It also introduces students to practical computational concepts used in image processing, gaming systems, robotics path mapping, and grid-based data manipulation.

This mini project serves as an excellent academic demonstration of how mathematical logic can be implemented efficiently using the C language.

## Key Features
- Accepts user-defined matrix dimensions
- Reads matrix elements dynamically
- Displays original matrix
- Rotates matrix by 90° clockwise
- Displays rotated output matrix
- Uses two-dimensional arrays and nested loops
- Simple and efficient logic implementation

## Technologies Used
- C Programming Language
- Arrays
- Nested Loops
- Index Mapping Logic

## Rotation Logic Used
The matrix rotation is performed using the following array transformation formula:

RotatedMatrix[j][rows - 1 - i] = OriginalMatrix[i][j]

This logic changes the position of every element from the original matrix into its new rotated position.

## Project Workflow
1. User enters number of rows and columns.
2. User inputs matrix elements.
3. Program displays original matrix.
4. Rotation algorithm processes each element.
5. Rotated matrix is stored in a temporary array.
6. Final rotated matrix is displayed.

## How to Run
1. Open the project in any C compiler (Turbo C / GCC / CodeBlocks / VS Code).
2. Compile the program file.
3. Run the executable.
4. Enter matrix dimensions and elements.
5. View original and rotated matrix output.

## Applications
- Image rotation systems
- Puzzle and board game logic
- Robotics grid transformation
- Data rearrangement algorithms
- Computer graphics

## Future Enhancements
- Add anticlockwise rotation
- Add 180 degree rotation
- Add transpose matrix operation
- Menu-driven user interface
- Dynamic memory allocation for larger matrices

## Author
Mini Project developed for academic demonstration of Array Logic and Matrix Manipulation in C.
