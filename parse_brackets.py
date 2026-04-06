import sys
text = open('frontend/src/pages/VideoPlayer.js').read()
stack = []
pairs = {'{': '}', '[': ']', '(': ')'}
for i, char in enumerate(text):
    if char in '{[(':
        stack.append((char, i))
    elif char in '}])':
        if not stack:
            print(f"Unmatched closing {char} at index {i}")
        else:
            last_char, last_i = stack.pop()
            if pairs[last_char] != char:
                print(f"Mismatched closing {char} at index {i}, expected {pairs[last_char]} for {last_char} at {last_i}")

if stack:
    print("Unclosed: " + str(stack))
else:
    print("All brackets balanced!")
