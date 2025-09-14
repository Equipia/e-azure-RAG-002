import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import styles from "./Answer.module.css";
import { ChatAppResponse, getCitationFilePath } from "../../api";
import { getOriginalPage } from "../../api/pdfPageMapping";

type HtmlParsedAnswer = {
    answerElements: React.ReactNode[];
    citations: string[];
};

export function parseAnswerToHtml(answer: ChatAppResponse, isStreaming: boolean, onCitationClicked: (citationFilePath: string) => void): HtmlParsedAnswer {
    // Returns React elements for answer with inline citations
    const possibleCitations = answer.context.data_points.citations || [];
    const citations: string[] = [];

    // Trim any whitespace from the end of the answer after removing follow-up questions
    let parsedAnswer = answer.message.content.trim();

    // Omit a citation that is still being typed during streaming
    if (isStreaming) {
        let lastIndex = parsedAnswer.length;
        for (let i = parsedAnswer.length - 1; i >= 0; i--) {
            if (parsedAnswer[i] === "]") {
                break;
            } else if (parsedAnswer[i] === "[") {
                lastIndex = i;
                break;
            }
        }
        const truncatedAnswer = parsedAnswer.substring(0, lastIndex);
        parsedAnswer = truncatedAnswer;
    }

    // Split into paragraphs by double newlines
    const paragraphStrings = parsedAnswer.split(/\n\n+/);
    const answerElements: React.ReactNode[] = [];

    // Add code for checking line before structured answers
    answerElements.push(
        <div key="code-for-checking" style={{ fontWeight: "bold", marginBottom: 8 }}>
            Code for checking: CSA Z8000-18 (Canadian Health Care Facilities)
        </div>
    );

    paragraphStrings.forEach((para, paraIdx) => {
        // Split paragraph into text and citations
        const parts = para.split(/\[([^\]]+)\]/g);
        const children: React.ReactNode[] = [];
        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0) {
                if (parts[i]) children.push(parts[i]);
            } else {
                const part = parts[i];
                let citationIndex: number;
                const isValidCitation = possibleCitations.some(citation => citation.startsWith(part));
                if (!isValidCitation) {
                    children.push(`[${part}]`);
                    continue;
                }
                if (citations.indexOf(part) !== -1) {
                    citationIndex = citations.indexOf(part) + 1;
                } else {
                    citations.push(part);
                    citationIndex = citations.length;
                }
                const path = getCitationFilePath(part);
                const strippedPath = path.replace(/\([^)]*\)$/, "");
                // Try to extract part file and page number from citation string
                let pageSuffix = "";
                const match = part.match(/(z8000-18-part\d+\.pdf)#page=(\d+)/);
                if (match) {
                    const [, partFile, pageStr] = match;
                    const pageNum = parseInt(pageStr, 10);
                    const origPage = getOriginalPage(partFile, pageNum);
                    if (origPage) {
                        pageSuffix = ` (Page ${origPage})`;
                    }
                }
                children.push(
                    <a className={styles.citation} title={part + pageSuffix} onClick={() => onCitationClicked(strippedPath)} key={`citation-${paraIdx}-${i}`}>
                        {/* Original: {`${citationIndex}. ${part}${pageSuffix}`} */}
                        (Source)
                    </a>
                );
            }
        }
        // Only add <p> if there is content
        if (children.length > 0) {
            answerElements.push(<p key={`para-${paraIdx}`}>{children}</p>);
        }
    });

    return {
        answerElements,
        citations
    };
}
