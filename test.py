import matplotlib.pyplot as plt

# Data
methods = ['MiniCheck', 'AlignScore', 'GPT-4o', 'Claude', '2xG', '2xC', 'G+C']
mediasum = [72.8, 70.8, 72.1, 72.7, 72.5, 72.5, 74.3]
meetingbank = [69.8, 71.6, 76.5, 77.7, 75.5, 76.1, 80.2]

x = range(len(methods))
bar_width = 0.35

# Plot
plt.figure(figsize=(12, 6))
plt.bar(x, mediasum, width=bar_width, label='MediaSum', color='skyblue')
plt.bar([i + bar_width for i in x], meetingbank, width=bar_width, label='MeetingBank', color='orange')

# Labels and title with increased font sizes
plt.xlabel('Method', fontsize=14)
plt.ylabel('Balanced Accuracy (BACC)', fontsize=14)
plt.xticks([i + bar_width / 2 for i in x], methods, rotation=45, fontsize=12)
plt.yticks(fontsize=12)
plt.ylim(65, 85)
plt.legend(fontsize=12)
plt.grid(axis='y', linestyle='--', alpha=0.7)

plt.tight_layout()
plt.show()
