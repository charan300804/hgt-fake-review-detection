# Heterogeneous Graph Transformer (HGT)–Based Fake Review Detection in Online Review Systems

### 1️⃣ Problem Objective
The primary objective of this project is to build an advanced, AI-based system that accurately detects fraudulent (fake) reviews on online shopping platforms. Unlike traditional text-only classifiers, this system goes a step further by learning the complex behavioral and relational patterns between users, their reviews, and the products they interact with.

### 2️⃣ Dataset and Input Stage
The foundation of this system relies on a labeled dataset (such as Amazon or Yelp reviews). This raw input data captures real-world interactions and serves as the baseline for our model training and prediction. The critical attributes in this dataset include:
*   👤 **User ID:** The unique identifier of the person writing the review.
*   🛒 **Product ID:** The unique identifier of the item being reviewed.
*   📝 **Review Text:** The actual written content of the feedback.
*   ⭐ **Rating:** The numerical score given by the user (e.g., 1 to 5 stars).
*   📅 **Timestamp:** The exact date and time the review was posted.
*   ✅ **Label:** The ground truth marking the review as `Fake` or `Genuine`.

### 3️⃣ Data Preprocessing
Raw data is often noisy, so before feeding it into the model, it must pass through a rigorous preprocessing pipeline to ensure it is clean, structured, and model-ready:
1.  **Remove Missing Values:** Any rows with null or incomplete essential fields are discarded to prevent training errors.
2.  **Clean Text:** We remove special characters, HTML tags, and extra symbols that add no semantic value.
3.  **Lowercase Conversion:** All review text is converted to lowercase to maintain uniformity.
4.  **Remove Stopwords:** Common conversational words (like "the", "is", "at") are stripped out.
5.  **Tokenization:** The text is broken down into individual usable words or tokens.
6.  **Stemming/Lemmatization (Optional):** Words are reduced to their root forms (e.g., "running" becomes "run").
7.  **Encode Categorical Variables:** `User ID` and `Product ID` are mapped to unique numerical indices.
8.  **Normalize Numerical Features:** Features like Ratings or Timestamps are scaled to a standard range (e.g., 0 to 1) for stable neural network training.

### 4️⃣ Heterogeneous Graph Construction (Core Architecture)
Instead of analyzing reviews independently in a vacuum, our system constructs a **Heterogeneous Graph**. It is deemed "heterogeneous" because it contains multiple distinct types of nodes and edges, allowing us to build a rich web of context. 

**Node Types in the Graph:**
*   👤 **User nodes**
*   🛒 **Product nodes**
*   📝 **Review nodes**

**Edge Relationships in the Graph:**
*   **User → *writes* → Review**
*   **Review → *belongs_to* → Product**
*   *(Optional)* User → *purchases* → Product
*   *(Optional)* User ↔ User (similarity or shared IP edges)

**Why this matters:** This graph architecture is vital because it enables the system to capture:
*   User behavioral patterns (e.g., rapid posting frequencies).
*   Review writing behavior across different item categories.
*   Product-review relationships (e.g., sudden spikes in 5-star reviews on a specific day).
*   Cross-product spam activity orchestrated by the same group.
*   Clusters of suspicious, coordinated activity.

### 5️⃣ Feature Representation
Before passing data along the graph, we must initialize the mathematical features for our nodes:
*   **Text Embeddings:** The preprocessed review text is converted into dense mathematical vectors (embeddings) using models like TF-IDF or transformer-based BERT embeddings.
*   **Numerical Features:** Ratings, helpful votes, and timestamps serve as additional quantitative node features.
*   These combined representations serve as the initial mathematical "state" of the nodes before they are passed into the deep learning model.

### 6️⃣ Heterogeneous Graph Transformer (HGT) Model
The HGT is the intelligent, beating heart of the system. Traditional Graph Neural Networks struggle with graphs containing different node types, but the HGT thrives here by performing:
*   **Type-specific node transformation:** Adapting its logic depending on if it's looking at a User or a Product.
*   **Relation-aware attention mechanism:** Assigning different levels of importance to different types of connections.
*   **Message passing across different node types:** Allowing a Product node to aggregate information from all its connected Review nodes, which in turn aggregate from User nodes.
*   **Multi-head attention across heterogeneous edges:** Focusing on diverse structural signals simultaneously.

By capturing both structural and semantic information, the HGT learns to identify hidden fraud patterns such as:
*   A single user posting dozens of 5-star reviews in under an hour.
*   Highly repeated review text appearing across entirely unrelated products.
*   A swarm of freshly created accounts generating bulk reviews simultaneously.
*   Groups of users suspiciously reviewing the exact same cluster of products (coordinated astroturfing).

### 7️⃣ Model Training
We teach the HGT to recognize these patterns through a structured supervised training process:
*   **Data Split:** The dataset is divided into 80% for training the model and 20% for testing its generalization.
*   **Labels:** We utilize the known `Fake` / `Genuine` labels to calculate error.
*   **Loss Function:** A cross-entropy loss function is applied to penalize incorrect predictions.
*   **Optimization:** We use the Adam optimizer to incrementally adjust the neural network's weights.
*   **Epochs:** The model trains repeatedly over multiple epochs, continually refining its accuracy.
*   **Monitoring:** Performance is meticulously tracked via metrics like Accuracy, Precision, Recall, and F1-score to ensure the model distinguishes fake reviews based on relational patterns, not just simple keywords.

### 8️⃣ Prediction Phase
In a live production environment, the trained system operates as an active filter:
1.  **Intake:** The system accepts a newly submitted review.
2.  **Graph Update:** It instantly connects this new `Review` node to its corresponding `User` and `Product` in the dynamic global graph.
3.  **Inference:** The localized subgraph surrounding this new review undergoes a forward pass through the trained HGT model.
4.  **Classification:** The model examines the relational context and outputs a final classification of **❌ FAKE** or **✅ GENUINE**, alongside a probability confidence score indicating its certainty.

### 9️⃣ Final Output
The comprehensive architecture guarantees that the system delivers:
*   Immediate, accurate review classification results.
*   Deep analytical insights into fraud rings and behavioral anomolies.
*   A scalable, real-time detection pipeline suitable for live e-commerce databases.
*   Vastly improved platform trust and consumer safety.

### 🔟 Project Summary
The proposed system detects fraudulent online reviews by preprocessing raw review datasets, constructing a heterogeneous graph of users, reviews, and products, and applying an advanced Heterogeneous Graph Transformer (HGT) model to learn complex relational and behavioral fraud patterns. Leveraging message-passing and relation-aware attention mechanisms across diverse node types, the trained model classifies incoming reviews as fake or genuine with high accuracy, ultimately enhancing trust and reliability in online review platforms.
