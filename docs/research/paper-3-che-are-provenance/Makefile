# Makefile — Paper 3: CHE/ARE Provenance
# Usage:
#   make draft     — compile venue-neutral draft
#   make ieee      — compile IEEE S&P version
#   make usenix    — compile USENIX Security version
#   make clean     — remove build artifacts
#   make figures   — compile all TikZ figures

DRAFT   = main-draft
IEEE    = ieee-sp/main
USENIX  = usenix-sec/main
LATEX   = pdflatex
BIBTEX  = bibtex

.PHONY: draft ieee usenix clean figures all

all: draft

draft: $(DRAFT).pdf

$(DRAFT).pdf: $(DRAFT).tex references.bib
	$(LATEX) $(DRAFT)
	$(BIBTEX) $(DRAFT)
	$(LATEX) $(DRAFT)
	$(LATEX) $(DRAFT)

ieee: $(IEEE).pdf

$(IEEE).pdf: $(IEEE).tex references.bib
	cd ieee-sp && $(LATEX) main && $(BIBTEX) main && $(LATEX) main && $(LATEX) main

usenix: $(USENIX).pdf

$(USENIX).pdf: $(USENIX).tex references.bib
	cd usenix-sec && $(LATEX) main && $(BIBTEX) main && $(LATEX) main && $(LATEX) main

figures:
	@echo "Compile individual TikZ figures here"
	@echo "TODO: add figure compilation targets"

clean:
	rm -f *.aux *.bbl *.blg *.log *.out *.pdf *.toc *.fls *.fdb_latexmk *.synctex.gz
	rm -f ieee-sp/*.aux ieee-sp/*.bbl ieee-sp/*.blg ieee-sp/*.log ieee-sp/*.out ieee-sp/*.pdf
	rm -f usenix-sec/*.aux usenix-sec/*.bbl usenix-sec/*.blg usenix-sec/*.log usenix-sec/*.out usenix-sec/*.pdf
