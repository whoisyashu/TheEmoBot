class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedListQueue {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  enqueue(value) {
    const node = new Node(value);

    if (!this.head) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }

    this.length++;
  }

  dequeue() {
    if (!this.head) return null;

    const val = this.head.value;
    this.head = this.head.next;

    if (!this.head) this.tail = null;

    this.length--;
    return val;
  }

  peek() {
    return this.head?.value || null;
  }

  isEmpty() {
    return this.length === 0;
  }

  toArray(limit = 5) {
    const out = [];
    let curr = this.head;

    while (curr && out.length < limit) {
      out.push(curr.value);
      curr = curr.next;
    }

    return out;
  }
}

module.exports = LinkedListQueue;
