class Calculator {
  constructor() {
    this.result = 0;
  }

  add(number) {
    this.result += number;
    return this;
  }

  subtract(number) {
    this.result -= number;
    return this;
  }

  multiply(number) {
    this.result *= number;
    return this;

  }

  divide(number) {
    if (number === 0) {
      throw new Error("Cannot divide by zero");
    }
    this.result /= number;
    return this;
  }

  getResult() {
    return this.result;
  }

  reset() {
    this.result = 0;
    return this;
  }

  
}


//write a binary search
class BinarySearch {
  constructor(arr) {
    this.arr = arr;
    this.sortedArr = arr.sort((a, b) => a - b);
    this.lowestIndex = 0;
    this.highestIndex = this.sortedArr.length - 1;
    this.guessIndex = Math.floor(this.highestIndex / 2);
  }
  search(target) {
    if (this.sortedArr[this.guessIndex] === target) {
      return true;
      }
      else if (this.sortedArr[this.guessIndex] < target) {
        this.lowestIndex = this.guessIndex + 1;
        this.guessIndex = Math.floor((this.highestIndex + this.lowestIndex) / 2);
        return this.search(target);
      }
      else if (this.sortedArr[this.guessIndex] > target) {
        this.arrhIndex = this.guessIndex - 1;
        this.guessIndex = Math.floor((this.highestIndex + this.lowestIndex) / 2);
        return this.search(target);
      }
      else {
        return false;
      }
   }
  }

          